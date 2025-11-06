/* eslint-disable no-await-in-loop */
/* eslint-disable max-lines-per-function */
/* eslint-disable dot-notation */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { TSingleResource } from 'localTypes/k8s'
import { reducer } from './reducer'
import { eventKey, compareRV, getRV } from './utils'
import type { TServerFrame, TScrollMsg } from './types'

export type TConnStatus = 'connecting' | 'open' | 'closed'

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

export type TUseListWatchOptions = {
  wsUrl: string
  pageSize?: number
  paused?: boolean
  ignoreRemove?: boolean
  onStatus?: (s: TConnStatus) => void
  onError?: (msg: string) => void
  autoDrain?: boolean
  preserveStateOnUrlChange?: boolean
  /** NEW: gate the hook on/off (default true). When false, no WS is opened. */
  isEnabled?: boolean
  query: TUseListWatchQuery
}

export type TUseListWatchReturn = {
  state: { order: string[]; byKey: Record<string, TSingleResource> }
  total: number
  hasMore: boolean
  continueToken?: string
  status: TConnStatus
  lastError?: string
  setPaused: (v: boolean) => void
  setIgnoreRemove: (v: boolean) => void
  sendScroll: () => void
  drainAll: (opts?: { maxPages?: number; maxItems?: number }) => Promise<number>
  reconnect: () => void
  setUrl: (next: string) => void
  setQuery: (q: TUseListWatchQuery) => void
}

type MaybeRV = unknown

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const readString = (obj: Record<string, unknown>, key: string): string | undefined => {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}
const itemRV = (it: MaybeRV): string | undefined => {
  const fromUtil = (getRV as (x: unknown) => string | undefined)(it)
  if (fromUtil) return fromUtil
  if (!isRecord(it)) return undefined
  const rvTop = readString(it, 'resourceVersion')
  const mdRaw = isRecord(it['metadata'] as unknown) ? (it['metadata'] as Record<string, unknown>) : undefined
  const rvMeta = mdRaw ? readString(mdRaw, 'resourceVersion') : undefined
  return rvTop ?? rvMeta
}
const getMaxRV = (items: readonly MaybeRV[] | undefined): string | undefined =>
  (items ?? []).reduce<string | undefined>((max, it) => {
    const rv = itemRV(it)
    return rv && (!max || compareRV(rv, max) > 0) ? rv : max
  }, undefined)

export const useListWatch = ({
  wsUrl,
  pageSize,
  paused = false,
  ignoreRemove = false,
  onStatus,
  onError,
  autoDrain = false,
  preserveStateOnUrlChange = true,
  isEnabled = true, // NEW default
  query,
}: TUseListWatchOptions): TUseListWatchReturn => {
  const resId = `${query.apiGroup ?? ''}|${query.apiVersion}|${query.plural}|${query.namespace ?? ''}|${
    query.fieldSelector ?? ''
  }|${query.labelSelector ?? ''}`
  const resIdRef = useRef(resId)

  // ------------------ state ------------------
  const [state, dispatch] = useReducer(reducer, { order: [], byKey: {} })
  const [contToken, setContToken] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<TConnStatus>(isEnabled ? 'connecting' : 'closed') // NEW: seed from isEnabled
  const [lastError, setLastError] = useState<string | undefined>(undefined)
  const [isPaused, setIsPaused] = useState(paused)
  const [isRemoveIgnored, setIsRemoveIgnored] = useState(ignoreRemove)
  const [queryState, setQueryState] = useState<TUseListWatchQuery>(query)

  // ------------------ refs ------------------
  const queryRef = useRef<TUseListWatchQuery>(query)
  const wsRef = useRef<WebSocket | null>(null)
  const connectingRef = useRef(false)
  const mountedRef = useRef(true)
  const startedRef = useRef(false)
  const reconnectTimerRef = useRef<number | null>(null)
  const backoffRef = useRef(750)
  const urlRef = useRef(wsUrl)
  const onMessageRef = useRef<(ev: MessageEvent) => void>(() => {})
  const connectRef = useRef<() => void>(() => {})
  const fetchingRef = useRef(false)
  const anchorRVRef = useRef<string | undefined>(undefined)
  const haveAnchorRef = useRef(false)
  const enabledRef = useRef(isEnabled) // NEW
  const intentionalCloseRef = useRef(false) // NEW: distinguish manual vs auto closes
  const suppressErrorsRef = useRef(false) // NEW: mute errors during intentional reconnects

  // keep external flags in refs
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
  }, [isEnabled]) // NEW

  useEffect(() => {
    queryRef.current = query
    setQueryState(query)
  }, [query])

  // --------------- helpers ---------------
  const clearErrorSafe = useCallback(() => {
    setLastError(undefined)
  }, [])

  const setStatusSafe = useCallback(
    (s: TConnStatus) => {
      setStatus(s)
      onStatus?.(s)
    },
    [onStatus],
  )

  const setErrorSafe = useCallback(
    (msg?: string) => {
      setLastError(msg)
      if (msg) onError?.(msg)
    },
    [onError],
  )

  const applyParam = (sp: URLSearchParams, key: string, v?: string | number | null) => {
    if (v === undefined || v === null || v === '') {
      sp.delete(key)
      return
    }
    sp.set(key, String(v))
  }

  const buildWsUrl = useCallback((raw: string) => {
    let u: URL
    const base = window.location.origin
    try {
      const hasScheme = /^[a-z]+:/i.test(raw)
      u = hasScheme ? new URL(raw) : new URL(raw.startsWith('/') ? raw : `/${raw}`, base)
      if (u.protocol === 'http:') u.protocol = 'ws:'
      if (u.protocol === 'https:') u.protocol = 'wss:'
      if (u.protocol !== 'ws:' && u.protocol !== 'wss:') {
        u = new URL(u.pathname + u.search + u.hash, base)
        u.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      }
    } catch {
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
  const closeWS = useCallback(() => {
    try {
      wsRef.current?.close()
    } catch {
      /* noop */
    }
    wsRef.current = null
  }, [])

  const scheduleReconnect = useCallback(() => {
    // NEW: don't schedule reconnects when disabled or when we intentionally closed
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
    const jitter = Math.random() * 0.4 + 0.8
    const wait = Math.floor(baseDelay * jitter)
    const next = Math.min(baseDelay * 2, 12000)
    backoffRef.current = next
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current || !enabledRef.current) return // NEW
      connectRef.current()
    }, wait)
  }, [setStatusSafe])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (!enabledRef.current) {
      // NEW
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
      if (!mountedRef.current || !enabledRef.current) return // NEW
      backoffRef.current = 750
      fetchingRef.current = false
      setStatusSafe('open')
      connectingRef.current = false
      suppressErrorsRef.current = false
    })

    ws.addEventListener('message', (ev: MessageEvent) => onMessageRef.current(ev))
    ws.addEventListener('close', scheduleReconnect)
    ws.addEventListener('error', () => {
      // If this error belongs to an intentional reconnect (or we’re suppressing),
      // ignore it. Let 'close' decide about reconnects.
      if (intentionalCloseRef.current || suppressErrorsRef.current) return
      setErrorSafe('WebSocket error')
      // Do NOT schedule reconnect here; 'close' will handle it.
    })
  }, [buildWsUrl, scheduleReconnect, setErrorSafe, setStatusSafe])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const reconnect = useCallback(() => {
    if (!enabledRef.current) {
      // NEW: if disabled, just ensure closed + status
      closeWS()
      setStatusSafe('closed')
      return
    }
    // Kill any pending auto-reconnect before we do a manual one
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

  // NEW: react to isEnabled flips
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

  // url change policy
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
        }
        if (enabledRef.current) reconnect() // NEW: guard
      }
    },
    [preserveStateOnUrlChange, reconnect, clearErrorSafe],
  )

  const setQuery = useCallback(
    (q: TUseListWatchQuery) => {
      setQueryState(q)
      clearErrorSafe()
      suppressErrorsRef.current = true
      queryRef.current = q
      if (!preserveStateOnUrlChange) {
        dispatch({ type: 'RESET', items: [] })
        setContToken(undefined)
        setHasMore(false)
        anchorRVRef.current = undefined
        haveAnchorRef.current = false
      }
    },
    [preserveStateOnUrlChange, clearErrorSafe],
  )

  useEffect(() => {
    if (!startedRef.current) return
    if (enabledRef.current) reconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryState])

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

      if (frame.type === 'INITIAL') {
        dispatch({ type: 'RESET', items: frame.items })
        setContToken(frame.continue)
        setHasMore(Boolean(frame.continue))
        setErrorSafe(undefined)
        fetchingRef.current = false
        suppressErrorsRef.current = false

        const snapshotRV = frame.resourceVersion || getMaxRV(frame.items)
        if (snapshotRV) {
          anchorRVRef.current = snapshotRV
          haveAnchorRef.current = true
        }
        return
      }

      if (frame.type === 'PAGE') {
        dispatch({ type: 'APPEND_PAGE', items: frame.items })
        setContToken(frame.continue)
        setHasMore(Boolean(frame.continue))
        fetchingRef.current = false

        const batchRV = getMaxRV(frame.items)
        if (batchRV && (!anchorRVRef.current || compareRV(batchRV, anchorRVRef.current) > 0)) {
          anchorRVRef.current = batchRV
        }
        return
      }

      if (frame.type === 'PAGE_ERROR') {
        setErrorSafe(frame.error || 'Failed to load next page')
        fetchingRef.current = false
        return
      }

      if (frame.type === 'ADDED' || frame.type === 'MODIFIED' || frame.type === 'DELETED') {
        const rv = itemRV(frame.item)
        if (rv && (!anchorRVRef.current || compareRV(rv, anchorRVRef.current) > 0)) {
          anchorRVRef.current = rv
        }
      }

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

  // mount/unmount
  useEffect(() => {
    if (startedRef.current) return undefined
    startedRef.current = true
    mountedRef.current = true
    if (isEnabled) {
      // NEW
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

  // keep url current
  useEffect(() => {
    if (wsUrl !== urlRef.current) setUrl(wsUrl)
  }, [wsUrl, setUrl])

  // --------------- react to effective query changes by resId ---------------
  useEffect(() => {
    if (resIdRef.current !== resId) {
      clearErrorSafe()
      suppressErrorsRef.current = true
      anchorRVRef.current = undefined
      haveAnchorRef.current = false
      resIdRef.current = resId
      setQueryState(query)
      if (enabledRef.current) reconnect()
    }
  }, [resId, query, reconnect, clearErrorSafe])

  // --------------- paging actions ---------------
  const pageSizeRef = useRef(pageSize)
  useEffect(() => {
    pageSizeRef.current = pageSize
  }, [pageSize])

  const sendScroll = useCallback(() => {
    if (!enabledRef.current) return // NEW
    const token = contToken
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!token || fetchingRef.current) return
    fetchingRef.current = true
    const msg: TScrollMsg = { type: 'SCROLL', continue: token, limit: pageSizeRef.current }
    wsRef.current.send(JSON.stringify(msg))
  }, [contToken])

  const drainAll = useCallback(
    async (opts?: { maxPages?: number; maxItems?: number }) => {
      if (!enabledRef.current) return 0 // NEW
      const maxPages = opts?.maxPages ?? 999
      const maxItems = opts?.maxItems ?? Number.POSITIVE_INFINITY
      let pages = 0
      let added = 0

      const awaitOnce = () =>
        new Promise<'PAGE' | 'STOP'>(resolve => {
          const handler = (ev: MessageEvent) => {
            try {
              const f = JSON.parse(String(ev.data)) as TServerFrame
              if (f.type === 'PAGE') {
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

  // --------------- auto drain ---------------
  useEffect(() => {
    if (!autoDrain) return
    if (!enabledRef.current) return // NEW
    if (status === 'open' && haveAnchorRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      drainAll().catch(() => {})
    }
  }, [autoDrain, drainAll, status])

  return {
    state,
    total,
    hasMore,
    continueToken,
    status,
    lastError,
    setPaused: setIsPaused,
    setIgnoreRemove: setIsRemoveIgnored,
    sendScroll,
    drainAll,
    reconnect,
    setUrl,
    setQuery,
  }
}
