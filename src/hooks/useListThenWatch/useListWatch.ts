/* eslint-disable no-await-in-loop */
/* eslint-disable max-lines-per-function */
/* eslint-disable dot-notation */

/**
 * React hook: useListWatch
 *
 * Opens a WebSocket connection to a server that streams list/watch frames for
 * Kubernetes-like resources. It manages:
 *  - connection lifecycle (connect, reconnect with backoff, manual reconnect)
 *  - paging ("SCROLL" messages to fetch next pages)
 *  - incremental updates (ADDED / MODIFIED / DELETED events)
 *  - a normalized state shape { order: string[]; byKey: Record<string, TSingleResource> }
 *  - resourceVersion (RV) tracking for anchoring the live stream after a snapshot
 *  - several controls (pause, ignore removes, auto-drain, enable/disable gate)
 *
 * The hook is deliberately defensive around URL/query changes and browser
 * navigation: you can choose to preserve existing state or reset on changes.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { TSingleResource } from 'localTypes/k8s'
import { reducer } from './reducer'
import { eventKey, compareRV, getRV } from './utils'
import type { TServerFrame, TScrollMsg } from './types'

export type TConnStatus = 'connecting' | 'open' | 'closed'

/**
 * Parameters that define which resource collection we are listing/watching.
 * These map to common Kubernetes list params and discovery fields.
 */
export type TUseListWatchQuery = {
  namespace?: string
  apiGroup?: string
  apiVersion: string
  plural: string
  fieldSelector?: string
  labelSelector?: string
  initialLimit?: number
  initialContinue?: string
}

/**
 * Hook configuration flags and callbacks.
 */
export type TUseListWatchOptions = {
  /** Base WebSocket URL or path (http[s] will be auto-upgraded to ws[s]) */
  wsUrl: string
  /** Page size for subsequent SCROLL requests */
  pageSize?: number
  /** Temporarily pause applying ADDED/MODIFIED/DELETED updates */
  paused?: boolean
  /** Skip applying DELETED events when true */
  ignoreRemove?: boolean
  /** Optional connection status observer */
  onStatus?: (s: TConnStatus) => void
  /** Optional error observer */
  onError?: (msg: string) => void
  /** If true, auto-fetch all remaining pages after snapshot */
  autoDrain?: boolean
  /** If false, reset state when URL or query changes */
  preserveStateOnUrlChange?: boolean
  /** Gate the hook on/off. When false, no WebSocket is opened. */
  isEnabled?: boolean
  /** What to list/watch */
  query: TUseListWatchQuery
}

/**
 * Values returned from the hook for rendering and control.
 */
export type TUseListWatchReturn = {
  state: { order: string[]; byKey: Record<string, TSingleResource> }
  total: number
  hasMore: boolean
  continueToken?: string
  status: TConnStatus
  lastError?: string
  hasInitial: boolean
  setPaused: (v: boolean) => void
  setIgnoreRemove: (v: boolean) => void
  /** Ask the server for the next page (if any) */
  sendScroll: () => void
  /** Drain multiple pages sequentially (client-side pagination helper) */
  drainAll: (opts?: { maxPages?: number; maxItems?: number }) => Promise<number>
  /** Manually reconnect the socket (cancels any pending auto-reconnect) */
  reconnect: () => void
  /** Change the base WebSocket URL (will reconnect if enabled) */
  setUrl: (next: string) => void
  /** Update the list/watch query (will reconnect if enabled) */
  setQuery: (q: TUseListWatchQuery) => void
}

// ------------------ RV helpers ------------------
/** Loose type used for extracting a resourceVersion from arbitrary frames */
type MaybeRV = unknown

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const readString = (obj: Record<string, unknown>, key: string): string | undefined => {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

/**
 * Attempt to read a resourceVersion from an item. We try in order:
 * 1) getRV(util) → user-provided extraction
 * 2) item.resourceVersion (top level)
 * 3) item.metadata.resourceVersion (k8s shape)
 */
const itemRV = (it: MaybeRV): string | undefined => {
  const fromUtil = (getRV as (x: unknown) => string | undefined)(it)
  if (fromUtil) return fromUtil
  if (!isRecord(it)) return undefined
  const rvTop = readString(it, 'resourceVersion')
  const mdRaw = isRecord(it['metadata'] as unknown) ? (it['metadata'] as Record<string, unknown>) : undefined
  const rvMeta = mdRaw ? readString(mdRaw, 'resourceVersion') : undefined
  return rvTop ?? rvMeta
}

/** Get the maximum RV from a batch of items (useful for anchoring) */
const getMaxRV = (items: readonly MaybeRV[] | undefined): string | undefined =>
  (items ?? []).reduce<string | undefined>((max, it) => {
    const rv = itemRV(it)
    return rv && (!max || compareRV(rv, max) > 0) ? rv : max
  }, undefined)

const makeResId = (q: TUseListWatchQuery) =>
  `${q.apiGroup ?? ''}|${q.apiVersion}|${q.plural}|${q.namespace ?? ''}|${q.fieldSelector ?? ''}|${
    q.labelSelector ?? ''
  }`

export const useListWatch = ({
  wsUrl,
  pageSize,
  paused = false,
  ignoreRemove = false,
  onStatus,
  onError,
  autoDrain = false,
  preserveStateOnUrlChange = true,
  isEnabled = true, // NEW default: socket gated by this flag
  query,
}: TUseListWatchOptions): TUseListWatchReturn => {
  /**
   * A stable identifier of the *effective* resource being watched. If this
   * changes, we should consider it a new stream (and optionally reset state).
   */
  const resId = `${query.apiGroup ?? ''}|${query.apiVersion}|${query.plural}|${query.namespace ?? ''}|${
    query.fieldSelector ?? ''
  }|${query.labelSelector ?? ''}`
  const resIdRef = useRef(resId)

  // ------------------ state ------------------
  const [state, dispatch] = useReducer(reducer, { order: [], byKey: {} })
  const [contToken, setContToken] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<TConnStatus>(isEnabled ? 'connecting' : 'closed') // seed from isEnabled
  const [lastError, setLastError] = useState<string | undefined>(undefined)
  const [isPaused, setIsPaused] = useState(paused)
  const [isRemoveIgnored, setIsRemoveIgnored] = useState(ignoreRemove)
  const [hasInitial, setHasInitial] = useState(false)
  // const [queryState, setQueryState] = useState<TUseListWatchQuery>(query)

  // ------------------ refs (mutable, non-reactive) ------------------
  const queryRef = useRef<TUseListWatchQuery>(query)
  const wsRef = useRef<WebSocket | null>(null)
  const connectingRef = useRef(false)
  const mountedRef = useRef(true)
  const startedRef = useRef(false)
  const reconnectTimerRef = useRef<number | null>(null)
  const backoffRef = useRef(750) // ms; exponential with cap & jitter
  const urlRef = useRef(wsUrl)
  const onMessageRef = useRef<(ev: MessageEvent) => void>(() => {})
  const connectRef = useRef<() => void>(() => {})
  const fetchingRef = useRef(false) // guards concurrent SCROLLs
  const anchorRVRef = useRef<string | undefined>(undefined) // latest known RV anchor
  const haveAnchorRef = useRef(false) // whether anchor was established
  const enabledRef = useRef(isEnabled) // mirror of prop to suppress races
  const intentionalCloseRef = useRef(false) // distinguish manual vs. auto closes
  const suppressErrorsRef = useRef(false) // mute transient errors during intentional reconnects

  // Keep external flags in refs for access inside event handlers
  const pausedRef = useRef(isPaused)
  const ignoreRemoveRef = useRef(isRemoveIgnored)
  useEffect(() => {
    pausedRef.current = isPaused
  }, [isPaused])
  useEffect(() => {
    ignoreRemoveRef.current = isRemoveIgnored
  }, [isRemoveIgnored])
  useEffect(() => {
    enabledRef.current = isEnabled
  }, [isEnabled])

  // // Keep a copy of query in state and ref (state is to trigger reconnect effect)
  // useEffect(() => {
  //   queryRef.current = query
  //   setQueryState(query)
  // }, [query])

  // --------------- helpers ---------------
  /** Clear the last error without notifying onError again */
  const clearErrorSafe = useCallback(() => {
    setLastError(undefined)
  }, [])

  /** Set connection status and notify listener safely */
  const setStatusSafe = useCallback(
    (s: TConnStatus) => {
      setStatus(s)
      onStatus?.(s)
    },
    [onStatus],
  )

  /** Set (and emit) an error message */
  const setErrorSafe = useCallback(
    (msg?: string) => {
      setLastError(msg)
      if (msg) onError?.(msg)
    },
    [onError],
  )

  /** Set/clear a URLSearchParams entry depending on value presence */
  const applyParam = (sp: URLSearchParams, key: string, v?: string | number | null) => {
    if (v === undefined || v === null || v === '') {
      sp.delete(key)
      return
    }
    sp.set(key, String(v))
  }

  /**
   * Build a safe ws(s):// URL from a raw path or http(s) URL, attach current
   * query params, and include sinceRV if we have an anchor established.
   */
  const buildWsUrl = useCallback((raw: string) => {
    let u: URL
    const base = window.location.origin
    try {
      const hasScheme = /^[a-z]+:/i.test(raw)
      u = hasScheme ? new URL(raw) : new URL(raw.startsWith('/') ? raw : `/${raw}`, base)
      if (u.protocol === 'http:') u.protocol = 'ws:'
      if (u.protocol === 'https:') u.protocol = 'wss:'
      if (u.protocol !== 'ws:' && u.protocol !== 'wss:') {
        // Fallback when a non-network scheme slips through
        u = new URL(u.pathname + u.search + u.hash, base)
        u.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      }
    } catch {
      // If constructing URL fails, try relative to origin with ws scheme
      const origin = window.location.origin.replace(/^http/, 'ws')
      u = new URL(raw.startsWith('/') ? raw : `/${raw}`, origin)
    }

    const q = queryRef.current
    applyParam(u.searchParams, 'namespace', q.namespace)
    applyParam(u.searchParams, 'limit', q.initialLimit)
    applyParam(u.searchParams, '_continue', q.initialContinue)
    applyParam(u.searchParams, 'apiGroup', q.apiGroup)
    applyParam(u.searchParams, 'apiVersion', q.apiVersion)
    applyParam(u.searchParams, 'plural', q.plural)
    applyParam(u.searchParams, 'fieldSelector', q.fieldSelector)
    applyParam(u.searchParams, 'labelSelector', q.labelSelector)

    if (haveAnchorRef.current && anchorRVRef.current) {
      u.searchParams.set('sinceRV', anchorRVRef.current)
    } else {
      u.searchParams.delete('sinceRV')
    }
    return u.toString()
  }, [])

  // --------------- socket plumbing ---------------
  /** Close and null the current WebSocket, swallowing errors */
  const closeWS = useCallback(() => {
    try {
      wsRef.current?.close()
    } catch {
      /* noop */
    }
    wsRef.current = null
  }, [])

  /**
   * Schedule an exponential backoff reconnect, unless we intentionally closed
   * or the hook is currently disabled.
   */
  const scheduleReconnect = useCallback(() => {
    // If the close was intentional, do not schedule reconnect.
    if (intentionalCloseRef.current) {
      intentionalCloseRef.current = false
      return
    }
    if (!enabledRef.current) {
      setStatusSafe('closed')
      connectingRef.current = false
      return
    }
    setStatusSafe('closed')
    connectingRef.current = false
    const baseDelay = Math.min(backoffRef.current, 8000)
    const jitter = Math.random() * 0.4 + 0.8 // 0.8x–1.2x
    const wait = Math.floor(baseDelay * jitter)
    const next = Math.min(baseDelay * 2, 12000)
    backoffRef.current = next
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current || !enabledRef.current) return
      connectRef.current()
    }, wait)
  }, [setStatusSafe])

  /** Establish a new WebSocket connection using the current URL and query */
  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (!enabledRef.current) {
      setStatusSafe('closed')
      return
    }
    if (connectingRef.current) return
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }
    connectingRef.current = true
    setStatusSafe('connecting')
    setErrorSafe(undefined)

    const url = buildWsUrl(urlRef.current)
    // eslint-disable-next-line no-console
    console.debug('[useListWatch] connecting to', url)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      if (!mountedRef.current || !enabledRef.current) return
      backoffRef.current = 750
      fetchingRef.current = false
      setStatusSafe('open')
      connectingRef.current = false
      suppressErrorsRef.current = false
    })

    ws.addEventListener('message', (ev: MessageEvent) => onMessageRef.current(ev))
    ws.addEventListener('close', scheduleReconnect)
    ws.addEventListener('error', () => {
      // Ignore error events that belong to an intentional reconnect or when
      // we're temporarily suppressing errors during url/query changes.
      if (intentionalCloseRef.current || suppressErrorsRef.current) return
      setErrorSafe('WebSocket error')
      // Reconnect is handled by 'close'.
    })
  }, [buildWsUrl, scheduleReconnect, setErrorSafe, setStatusSafe])

  // Expose the latest connect function to other callbacks/handlers
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  /** Manually reconnect now; cancels a pending auto-reconnect if any */
  const reconnect = useCallback(() => {
    if (!enabledRef.current) {
      closeWS()
      setStatusSafe('closed')
      return
    }
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    intentionalCloseRef.current = true
    try {
      wsRef.current?.close()
    } catch {
      /* noop */
    }
    wsRef.current = null
    connect()
  }, [closeWS, connect, setStatusSafe])

  // --------------- URL & Query change policies ---------------
  /** Update base URL; optionally reset state; reconnect if enabled */
  const setUrl = useCallback(
    (next: string) => {
      const changed = next !== urlRef.current
      urlRef.current = next
      if (changed) {
        clearErrorSafe()
        suppressErrorsRef.current = true
        if (!preserveStateOnUrlChange) {
          dispatch({ type: 'RESET', items: [] })
          setContToken(undefined)
          setHasMore(false)
          anchorRVRef.current = undefined
          haveAnchorRef.current = false
          setHasInitial(false)
        }
        if (enabledRef.current) reconnect()
      }
    },
    [preserveStateOnUrlChange, reconnect, clearErrorSafe],
  )

  /** Update query (fields/labels/etc). State reset depends on policy */
  const setQuery = useCallback(
    (q: TUseListWatchQuery) => {
      clearErrorSafe()
      suppressErrorsRef.current = true

      const prev = queryRef.current
      const prevId = makeResId(prev)
      const nextId = makeResId(q)

      queryRef.current = q

      if (!preserveStateOnUrlChange) {
        dispatch({ type: 'RESET', items: [] })
        setContToken(undefined)
        setHasMore(false)
        setHasInitial(false)
      }

      // Drop RV anchors if the effective resource changed
      if (prevId !== nextId) {
        anchorRVRef.current = undefined
        haveAnchorRef.current = false
      }

      if (enabledRef.current && prevId !== nextId) {
        reconnect() // <-- open a fresh socket with the new fieldSelector
      }
    },
    [clearErrorSafe, preserveStateOnUrlChange, reconnect],
  )

  // On queryState change post-mount, reconnect if enabled
  // useEffect(() => {
  //   if (!startedRef.current) return
  //   if (enabledRef.current) reconnect()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [queryState])

  // Derived values for consumers
  const total = state.order.length
  const continueToken = contToken

  // --------------- message handling ---------------
  useEffect(() => {
    onMessageRef.current = (ev: MessageEvent) => {
      let frame: TServerFrame | undefined
      try {
        frame = JSON.parse(String(ev.data)) as TServerFrame
      } catch {
        return
      }
      if (!frame) return

      // Logs from Server (errors basically)
      if (frame.type === 'SERVER_LOG') {
        const level = frame.level || 'info'
        const msg = frame.message
        // eslint-disable-next-line no-console
        ;(console[level] || console.log).call(console, '[useListWatch][server]', msg)
        return
      }

      // Logs from Server (errors basically)
      if (frame.type === 'INITIAL_ERROR') {
        const msg = frame.message
        setErrorSafe(msg)
        return
      }

      // Initial snapshot (with optional paging token) establishes base state
      if (frame.type === 'INITIAL') {
        dispatch({ type: 'RESET', items: frame.items })
        setContToken(frame.continue)
        setHasMore(Boolean(frame.continue))
        setErrorSafe(undefined)
        fetchingRef.current = false
        suppressErrorsRef.current = false

        // Determine an anchor RV from the snapshot or its items
        const snapshotRV = frame.resourceVersion || getMaxRV(frame.items)
        if (snapshotRV) {
          anchorRVRef.current = snapshotRV
          haveAnchorRef.current = true
        }

        setHasInitial(true)

        return
      }

      // Next page of snapshot data (still before live watch)
      if (frame.type === 'PAGE') {
        dispatch({ type: 'APPEND_PAGE', items: frame.items })
        setContToken(frame.continue)
        setHasMore(Boolean(frame.continue))
        fetchingRef.current = false

        // Track the highest RV we've seen to keep the anchor fresh
        const batchRV = getMaxRV(frame.items)
        if (batchRV && (!anchorRVRef.current || compareRV(batchRV, anchorRVRef.current) > 0)) {
          anchorRVRef.current = batchRV
        }
        return
      }

      // Server failed a page fetch
      if (frame.type === 'PAGE_ERROR') {
        setErrorSafe(frame.error || 'Failed to load next page')
        fetchingRef.current = false
        return
      }

      // Live stream events (after snapshot is complete)
      if (frame.type === 'ADDED' || frame.type === 'MODIFIED' || frame.type === 'DELETED') {
        const rv = itemRV(frame.item)
        if (rv && (!anchorRVRef.current || compareRV(rv, anchorRVRef.current) > 0)) {
          anchorRVRef.current = rv
        }
      }

      // Apply live updates unless paused, with optional delete suppression
      if (!pausedRef.current) {
        if (frame.type === 'ADDED' || frame.type === 'MODIFIED') {
          dispatch({ type: 'UPSERT', item: frame.item })
        }
        if (!ignoreRemoveRef.current && frame.type === 'DELETED') {
          dispatch({ type: 'REMOVE', key: eventKey(frame.item) })
        }
      }
    }
  }, [setErrorSafe])

  // --------------- mount/unmount ---------------
  useEffect(() => {
    if (startedRef.current) return undefined
    startedRef.current = true
    mountedRef.current = true
    if (isEnabled) {
      connect()
    } else {
      setStatusSafe('closed')
    }
    return () => {
      mountedRef.current = false
      startedRef.current = false
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      closeWS()
      wsRef.current = null
      connectingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep internal URL in sync with prop
  useEffect(() => {
    if (wsUrl !== urlRef.current) setUrl(wsUrl)
  }, [wsUrl, setUrl])

  // React to isEnabled flips by connecting/closing
  useEffect(() => {
    if (!mountedRef.current) return
    if (isEnabled) {
      connect()
    } else {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      closeWS()
      setStatusSafe('closed')
    }
  }, [isEnabled, closeWS, connect, setStatusSafe])

  // --------------- react to *effective* query changes by resId ---------------
  useEffect(() => {
    if (resIdRef.current !== resId) {
      clearErrorSafe()
      suppressErrorsRef.current = true
      anchorRVRef.current = undefined
      haveAnchorRef.current = false
      setHasInitial(false)
      resIdRef.current = resId
      // setQueryState(query)
      queryRef.current = query
      if (enabledRef.current) reconnect()
    }
  }, [resId, query, reconnect, clearErrorSafe])

  // --------------- paging actions ---------------
  const pageSizeRef = useRef(pageSize)
  useEffect(() => {
    pageSizeRef.current = pageSize
  }, [pageSize])

  /** Ask server for next page, if a continue token is present and socket is open */
  const sendScroll = useCallback(() => {
    if (!enabledRef.current) return
    const token = contToken
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!token || fetchingRef.current) return
    fetchingRef.current = true
    const msg: TScrollMsg = { type: 'SCROLL', continue: token, limit: pageSizeRef.current }
    wsRef.current.send(JSON.stringify(msg))
  }, [contToken])

  /**
   * Drain pages sequentially. Useful for "load all" UX. Returns the number of
   * *new* items appended (ignoring items that were already present).
   */
  const drainAll = useCallback(
    async (opts?: { maxPages?: number; maxItems?: number }) => {
      if (!enabledRef.current) return 0
      const maxPages = opts?.maxPages ?? 999
      const maxItems = opts?.maxItems ?? Number.POSITIVE_INFINITY
      let pages = 0
      let added = 0

      // Wait for exactly one PAGE (or STOP if not possible)
      const awaitOnce = () =>
        new Promise<'PAGE' | 'STOP'>(resolve => {
          const handler = (ev: MessageEvent) => {
            try {
              const f = JSON.parse(String(ev.data)) as TServerFrame
              if (f.type === 'PAGE') {
                // Count *new* items only (those not present in byKey yet)
                const newCount = (f.items || []).reduce((acc, it) => {
                  const k = eventKey(it)
                  return state.byKey[k] ? acc : acc + 1
                }, 0)
                added += newCount
                const ws = wsRef.current
                if (!ws) {
                  resolve('STOP')
                  return
                }
                resolve('PAGE')
              }
            } catch {
              /* noop */
            }
          }
          const ws = wsRef.current
          if (!ws) {
            resolve('STOP')
            return
          }
          const stopCheck = () => {
            if (!hasMore || !contToken) {
              resolve('STOP')
            }
          }
          // Add temporary listener once to avoid leaks
          ws.addEventListener('message', handler as EventListener, { once: true })
          setTimeout(stopCheck, 0)
        })

      // Loop until we hit page or item limits, or run out of pages/socket
      while (pages < maxPages && hasMore && contToken && wsRef.current?.readyState === WebSocket.OPEN) {
        if (added >= maxItems) break
        if (!fetchingRef.current) sendScroll()
        const r = await awaitOnce()
        if (r === 'STOP') break
        pages += 1
      }
      return added
    },
    [contToken, hasMore, sendScroll, state.byKey],
  )

  // --------------- optional auto-drain after snapshot ---------------
  useEffect(() => {
    if (!autoDrain) return
    if (!enabledRef.current) return
    if (status === 'open' && haveAnchorRef.current) {
      // Fire and forget; errors are swallowed
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      drainAll().catch(() => {})
    }
  }, [autoDrain, drainAll, status])

  // --------------- public API ---------------
  return {
    state,
    total,
    hasMore,
    continueToken,
    status,
    lastError,
    hasInitial,
    setPaused: setIsPaused,
    setIgnoreRemove: setIsRemoveIgnored,
    sendScroll,
    drainAll,
    reconnect,
    setUrl,
    setQuery,
  }
}
