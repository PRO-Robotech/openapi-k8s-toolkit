/* eslint-disable max-lines-per-function */
// ------------------------------------------------------------
// Simple, self-contained React component implementing:
// - WebSocket connection to your events endpoint
// - Handling of INITIAL, PAGE, ADDED, MODIFIED, DELETED, PAGE_ERROR
// - Infinite scroll via IntersectionObserver (sends { type: "SCROLL" })
// - Lightweight CSS-in-JS styling
// - Minimal reconnection logic (bounded exponential backoff)
// - Small initials avatar (derived from a name/kind)
// ------------------------------------------------------------

import React, { FC, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { theme as antdtheme, Flex, Tooltip, Empty } from 'antd'
import { getKinds } from 'api/bff/search/getKinds'
import { getSortedKindsAll } from 'utils/getSortedKindsAll'
import { pluralByKind } from 'utils/pluralByKind'
import { TKindIndex } from 'localTypes/bff/search'
import { TKindWithVersion } from 'localTypes/search'
import { ResumeCircleIcon, PauseCircleIcon, LockedIcon, UnlockedIcon } from 'components/atoms'
import { TNavigationResource } from 'localTypes/navigations'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { TScrollMsg, TServerFrame } from './types'
import { eventKey, compareRV, getRV, getMaxRV } from './utils'
import { reducer } from './reducer'
import { EventRow } from './molecules'
import { Styled } from './styled'

export type TEventsProps = {
  theme: 'dark' | 'light'
  baseprefix?: string
  cluster: string
  wsUrl: string
  pageSize?: number
  substractHeight?: number
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseNamespaceFactoryKey: string
  baseNavigationPlural: string
  baseNavigationName: string
}

export const Events: FC<TEventsProps> = ({
  theme,
  baseprefix,
  cluster,
  wsUrl,
  pageSize = 50,
  substractHeight,
  baseFactoryNamespacedAPIKey,
  baseFactoryClusterSceopedAPIKey,
  baseFactoryNamespacedBuiltinKey,
  baseFactoryClusterSceopedBuiltinKey,
  baseNamespaceFactoryKey,
  baseNavigationPlural,
  baseNavigationName,
}) => {
  const { token } = antdtheme.useToken()

  // const [error, setError] = useState<TRequestError | undefined>()
  // const [isLoading, setIsLoading] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [kindIndex, setKindIndex] = useState<TKindIndex>()
  const [kindsWithVersion, setKindWithVersion] = useState<TKindWithVersion[]>()

  useEffect(() => {
    // setIsLoading(true)
    // setError(undefined)
    getKinds({ cluster })
      .then(data => {
        setKindIndex(data)
        setKindWithVersion(getSortedKindsAll(data))
        // setIsLoading(false)
        // setError(undefined)
      })
      .catch(error => {
        // setIsLoading(false)
        // setError(error)
        // eslint-disable-next-line no-console
        console.error(error)
      })
  }, [cluster])

  const { data: navigationDataArr } = useK8sSmartResource<{
    items: TNavigationResource[]
  }>({
    cluster,
    group: 'front.in-cloud.io',
    version: 'v1alpha1',
    plural: baseNavigationPlural,
    fieldSelector: `metadata.name=${baseNavigationName}`,
  })

  // pause behaviour
  const [isPaused, setIsPaused] = useState(false)
  const pausedRef = useRef(isPaused)

  useEffect(() => {
    pausedRef.current = isPaused
  }, [isPaused])

  // ignore REMOVE signal
  const [isRemoveIgnored, setIsRemoveIgnored] = useState(true)
  const removeIgnoredRef = useRef(isRemoveIgnored)

  useEffect(() => {
    removeIgnoredRef.current = isRemoveIgnored
  }, [isRemoveIgnored])

  // track latest resourceVersion we have processed
  const latestRVRef = useRef<string | undefined>(undefined)

  // Reducer-backed store of events
  const [state, dispatch] = useReducer(reducer, { order: [], byKey: {} })

  // Pagination/bookmarking state returned by server
  const [contToken, setContToken] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState<boolean>(false)

  // Connection state & errors for small status UI
  const [connStatus, setConnStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')
  const [lastError, setLastError] = useState<string | undefined>(undefined)

  // ------------------ Refs (mutable, do not trigger render) ------------------
  const wsRef = useRef<WebSocket | null>(null) // current WebSocket instance
  const listRef = useRef<HTMLDivElement | null>(null) // scrollable list element
  const sentinelRef = useRef<HTMLDivElement | null>(null) // bottom sentinel for IO
  const wantMoreRef = useRef(false) // whether sentinel is currently visible
  const fetchingRef = useRef(false) // guard: avoid parallel PAGE requests
  const backoffRef = useRef(750) // ms; increases on failures up to a cap
  const urlRef = useRef(wsUrl) // latest wsUrl (stable inside callbacks)

  // Guards for unmount & reconnect timer
  const mountedRef = useRef(true)
  const reconnectTimerRef = useRef<number | null>(null)
  const onMessageRef = useRef<(ev: MessageEvent) => void>(() => {})
  const startedRef = useRef(false)
  const connectingRef = useRef(false)
  const haveAnchorRef = useRef(false)

  // Keep urlRef in sync so connect() uses the latest wsUrl
  useEffect(() => {
    urlRef.current = wsUrl
  }, [wsUrl])

  // Close current WS safely
  const closeWS = useCallback(() => {
    try {
      wsRef.current?.close()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
    wsRef.current = null
  }, [])

  // Attempt to request the next page of older events
  const sendScroll = useCallback(() => {
    const token = contToken
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!token || fetchingRef.current) return
    fetchingRef.current = true
    const msg: TScrollMsg = { type: 'SCROLL', continue: token, limit: pageSize }
    wsRef.current.send(JSON.stringify(msg))
  }, [contToken, pageSize])

  const maybeAutoScroll = useCallback(() => {
    if (wantMoreRef.current && hasMore) sendScroll()
  }, [hasMore, sendScroll])

  // Handle all incoming frames from the server
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
        setLastError(undefined)
        fetchingRef.current = false

        const snapshotRV = frame.resourceVersion || getMaxRV(frame.items)
        if (snapshotRV) {
          latestRVRef.current = snapshotRV
          haveAnchorRef.current = true // NEW: we now have a safe anchor
        }
        return
      }

      if (frame.type === 'PAGE') {
        dispatch({ type: 'APPEND_PAGE', items: frame.items })
        setContToken(frame.continue)
        setHasMore(Boolean(frame.continue))
        fetchingRef.current = false

        const batchRV = getMaxRV(frame.items)
        if (batchRV && (!latestRVRef.current || compareRV(batchRV, latestRVRef.current) > 0)) {
          latestRVRef.current = batchRV
        }
        maybeAutoScroll()
        return
      }

      if (frame.type === 'PAGE_ERROR') {
        setLastError(frame.error || 'Failed to load next page')
        fetchingRef.current = false
        return
      }

      if (frame.type === 'ADDED' || frame.type === 'MODIFIED' || frame.type === 'DELETED') {
        const rv = getRV(frame.item)
        if (rv && (!latestRVRef.current || compareRV(rv, latestRVRef.current) > 0)) {
          latestRVRef.current = rv
        }
      }

      if (!pausedRef.current) {
        if (frame.type === 'ADDED' || frame.type === 'MODIFIED') {
          dispatch({ type: 'UPSERT', item: frame.item })
          return
        }

        if (!removeIgnoredRef.current && frame.type === 'DELETED') {
          dispatch({ type: 'REMOVE', key: eventKey(frame.item) })
        }
      }
    }
  }, [maybeAutoScroll])

  const buildWsUrl = useCallback((raw: string) => {
    try {
      const hasScheme = /^[a-z]+:/i.test(raw)
      const base = window.location.origin
      let u = hasScheme ? new URL(raw) : new URL(raw.startsWith('/') ? raw : `/${raw}`, base)
      if (u.protocol === 'http:') u.protocol = 'ws:'
      if (u.protocol === 'https:') u.protocol = 'wss:'
      if (u.protocol !== 'ws:' && u.protocol !== 'wss:') {
        u = new URL(u.pathname + u.search + u.hash, base)
        u.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      }
      if (haveAnchorRef.current && latestRVRef.current) {
        u.searchParams.set('sinceRV', latestRVRef.current)
      } else {
        u.searchParams.delete('sinceRV')
      }
      return u.toString()
    } catch {
      const origin = window.location.origin.replace(/^http/, 'ws')
      const prefix = raw.startsWith('/') ? '' : '/'
      const rv = haveAnchorRef.current ? latestRVRef.current : undefined
      const sep = raw.includes('?') ? '&' : '?'
      return `${origin}${prefix}${raw}${rv ? `${sep}sinceRV=${encodeURIComponent(rv)}` : ''}`
    }
  }, [])

  // Establish and maintain the WebSocket connection with bounded backoff
  const connect = useCallback(() => {
    if (!mountedRef.current) return
    // Prevent duplicate opens
    if (connectingRef.current) return
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }
    connectingRef.current = true

    setConnStatus('connecting')
    setLastError(undefined)

    const url = buildWsUrl(urlRef.current)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      if (!mountedRef.current) return
      backoffRef.current = 750
      fetchingRef.current = false
      setConnStatus('open')
      connectingRef.current = false
    })

    ws.addEventListener('message', ev => onMessageRef.current(ev))

    const scheduleReconnect = () => {
      if (wsRef.current === ws) wsRef.current = null
      setConnStatus('closed')
      connectingRef.current = false
      // Bounded exponential backoff with jitter to avoid herding
      const base = Math.min(backoffRef.current, 8000)
      const jitter = Math.random() * 0.4 + 0.8 // 0.8x–1.2x
      const wait = Math.floor(base * jitter)
      const next = Math.min(base * 2, 12000)
      backoffRef.current = next
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return
        connect()
      }, wait)
    }

    ws.addEventListener('close', scheduleReconnect)
    ws.addEventListener('error', () => {
      setLastError('WebSocket error')
      scheduleReconnect()
    })
  }, [buildWsUrl])

  // Kick off initial connection on mount; clean up on unmount
  useEffect(() => {
    if (startedRef.current) return undefined // StrictMode double-invoke guard
    startedRef.current = true

    mountedRef.current = true
    connect()

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
    // INTENTIONALLY EMPTY DEPS – do not reopen on state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // IntersectionObserver to trigger SCROLL when sentinel becomes visible
  useEffect(() => {
    // Get the current DOM element referenced by sentinelRef
    const el = sentinelRef.current

    // If the sentinel element is not mounted yet, exit early
    if (!el) return undefined

    // Create a new IntersectionObserver to watch visibility changes of the sentinel
    const io = new IntersectionObserver(entries => {
      // Determine if any observed element is currently visible in the viewport
      const visible = entries.some(e => e.isIntersecting)

      // Store the current visibility status in a ref (no re-render triggered)
      wantMoreRef.current = visible

      // If sentinel is visible and there are more pages available, request the next page
      if (visible && hasMore) sendScroll()
    })

    // Start observing the sentinel element for intersection events
    io.observe(el)

    // Cleanup: disconnect the observer when component unmounts or dependencies change
    return () => io.disconnect()

    // Dependencies: re-run this effect if hasMore or sendScroll changes
  }, [hasMore, sendScroll])

  // Fallback: if user scrolls near bottom manually, also try to fetch
  const onScroll = useCallback(() => {
    if (!listRef.current) return
    const nearBottom = listRef.current.scrollTop + listRef.current.clientHeight >= listRef.current.scrollHeight - 24
    if (nearBottom && hasMore) sendScroll()
  }, [hasMore, sendScroll])

  const total = state.order.length

  const getPlural = kindsWithVersion ? pluralByKind(kindsWithVersion) : undefined

  const baseFactoriesMapping =
    navigationDataArr && navigationDataArr.items && navigationDataArr.items.length > 0
      ? navigationDataArr.items[0].spec?.baseFactoriesMapping
      : undefined

  return (
    <Styled.Root $substractHeight={substractHeight || 340}>
      <Styled.Header>
        <Styled.HeaderLeftSide>
          <Flex justify="start" align="center" gap={10}>
            <Styled.CursorPointerDiv
              onClick={() => {
                if (isPaused) {
                  setIsPaused(false)
                } else {
                  setIsPaused(true)
                }
              }}
            >
              {isPaused ? <ResumeCircleIcon /> : <PauseCircleIcon />}
            </Styled.CursorPointerDiv>
            <Styled.StatusText>
              {isPaused && 'Streaming paused'}
              {!isPaused && connStatus === 'connecting' && 'Connecting…'}
              {!isPaused && connStatus === 'open' && 'Streaming events...'}
              {!isPaused && connStatus === 'closed' && 'Reconnecting…'}
            </Styled.StatusText>
          </Flex>
        </Styled.HeaderLeftSide>
        <Styled.HeaderRightSide $colorTextDescription={token.colorTextDescription}>
          {!hasMore && <div>No more events · </div>}
          {typeof total === 'number' ? <div>Loaded {total} events</div> : ''}
          {lastError && <span aria-live="polite"> · {lastError}</span>}
          <Tooltip
            title={
              <div>
                <div>{isRemoveIgnored ? 'Handle REMOVE signals' : 'Ignore REMOVE signals'}</div>
                <Flex justify="end">Locked means ignore</Flex>
              </div>
            }
            placement="left"
          >
            <Styled.CursorPointerDiv onClick={() => setIsRemoveIgnored(!isRemoveIgnored)}>
              {isRemoveIgnored ? <LockedIcon size={16} /> : <UnlockedIcon size={16} />}
            </Styled.CursorPointerDiv>
          </Tooltip>
        </Styled.HeaderRightSide>
      </Styled.Header>

      {/* Scrollable list of event rows */}
      <Styled.List ref={listRef} onScroll={onScroll}>
        {state.order.length > 0 ? (
          state.order.map(k => (
            <EventRow
              key={k}
              e={state.byKey[k]}
              theme={theme}
              baseprefix={baseprefix}
              cluster={cluster}
              getPlural={getPlural}
              baseFactoryNamespacedAPIKey={baseFactoryNamespacedAPIKey}
              baseFactoryClusterSceopedAPIKey={baseFactoryClusterSceopedAPIKey}
              baseFactoryNamespacedBuiltinKey={baseFactoryNamespacedBuiltinKey}
              baseFactoryClusterSceopedBuiltinKey={baseFactoryClusterSceopedBuiltinKey}
              baseNamespaceFactoryKey={baseNamespaceFactoryKey}
              baseFactoriesMapping={baseFactoriesMapping}
            />
          ))
        ) : (
          <Empty description="No events" />
        )}
        {/* Infinite scroll sentinel */}
        <Styled.Sentinel ref={sentinelRef} />
      </Styled.List>

      {state.order.length > 0 && (
        <Styled.Timeline $colorText={token.colorText} $substractHeight={substractHeight || 340} />
      )}
    </Styled.Root>
  )
}
