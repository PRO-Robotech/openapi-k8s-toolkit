import React, { FC } from 'react'
import styled from 'styled-components'

type TSyncedHorizontalScrollbarProps = {
  tableContainerRef: React.RefObject<HTMLDivElement>
  disabled?: boolean
}

type TScrollbarMetrics = {
  clientWidth: number
  scrollWidth: number
  visible: boolean
}

type TScrollerBinding = {
  scroller: HTMLElement | null
  content: Element | null
}

const SCROLLABLE_TABLE_SELECTOR = '.ant-table-body, .ant-table-content'
const EMPTY_SCROLLBAR_METRICS = {
  clientWidth: 0,
  scrollWidth: 0,
  visible: false,
}

const HorizontalScrollbar = styled.div`
  position: sticky;
  bottom: var(--enriched-table-scrollbar-bottom-offset, 0px);
  z-index: 1056;
  height: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  background: transparent;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.35) transparent;

  &::-webkit-scrollbar {
    height: 12px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.35);
    background-clip: content-box;
    border: 3px solid transparent;
    border-radius: 999px;
  }
`

const HorizontalScrollbarInner = styled.div`
  height: 1px;
`

export const SyncedHorizontalScrollbar: FC<TSyncedHorizontalScrollbarProps> = ({
  tableContainerRef,
  disabled = false,
}) => {
  const scrollbarRef = React.useRef<HTMLDivElement>(null)
  const tableScrollerRef = React.useRef<HTMLElement | null>(null)
  const isSyncingRef = React.useRef(false)
  const refreshRafRef = React.useRef<number | null>(null)
  const [metrics, setMetrics] = React.useState<TScrollbarMetrics>(EMPTY_SCROLLBAR_METRICS)
  const [scrollerBinding, setScrollerBinding] = React.useState<TScrollerBinding>({
    scroller: null,
    content: null,
  })

  const releaseSyncLock = React.useCallback(() => {
    if (typeof window.requestAnimationFrame !== 'function') {
      isSyncingRef.current = false
      return
    }

    window.requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }, [])

  const bindTableScroller = React.useCallback((tableScroller: HTMLElement | null) => {
    const tableScrollerContent = tableScroller?.firstElementChild || null
    tableScrollerRef.current = tableScroller

    setScrollerBinding(currentBinding =>
      currentBinding.scroller === tableScroller && currentBinding.content === tableScrollerContent
        ? currentBinding
        : {
            scroller: tableScroller,
            content: tableScrollerContent,
          },
    )
  }, [])

  const findTableScroller = React.useCallback(
    () => (disabled ? null : tableContainerRef.current?.querySelector<HTMLElement>(SCROLLABLE_TABLE_SELECTOR) || null),
    [disabled, tableContainerRef],
  )

  const updateMetrics = React.useCallback((tableScroller: HTMLElement | null) => {
    tableScrollerRef.current = tableScroller

    if (!tableScroller) {
      setMetrics(currentMetrics => (currentMetrics.visible ? EMPTY_SCROLLBAR_METRICS : currentMetrics))
      return
    }

    const nextMetrics = {
      clientWidth: tableScroller.clientWidth,
      scrollWidth: tableScroller.scrollWidth,
      visible: tableScroller.scrollWidth > tableScroller.clientWidth + 1,
    }

    setMetrics(currentMetrics =>
      currentMetrics.clientWidth === nextMetrics.clientWidth &&
      currentMetrics.scrollWidth === nextMetrics.scrollWidth &&
      currentMetrics.visible === nextMetrics.visible
        ? currentMetrics
        : nextMetrics,
    )

    if (scrollbarRef.current && scrollbarRef.current.scrollLeft !== tableScroller.scrollLeft) {
      scrollbarRef.current.scrollLeft = tableScroller.scrollLeft
    }
  }, [])

  const refreshTableScroller = React.useCallback(() => {
    const tableScroller = findTableScroller()
    bindTableScroller(tableScroller)
    updateMetrics(tableScroller)
  }, [bindTableScroller, findTableScroller, updateMetrics])

  const cancelScheduledRefresh = React.useCallback(() => {
    if (refreshRafRef.current === null || typeof window.cancelAnimationFrame !== 'function') {
      return
    }

    window.cancelAnimationFrame(refreshRafRef.current)
    refreshRafRef.current = null
  }, [])

  const scheduleRefreshTableScroller = React.useCallback(() => {
    if (typeof window.requestAnimationFrame !== 'function') {
      refreshTableScroller()
      return
    }

    if (refreshRafRef.current !== null) {
      return
    }

    refreshRafRef.current = window.requestAnimationFrame(() => {
      refreshRafRef.current = null
      refreshTableScroller()
    })
  }, [refreshTableScroller])

  React.useLayoutEffect(() => {
    refreshTableScroller()
  }, [refreshTableScroller])

  React.useEffect(() => {
    // Some wrappers attach the outer table ref after the child layout pass; this keeps first measurement reliable.
    refreshTableScroller()
  }, [refreshTableScroller])

  React.useEffect(() => {
    if (disabled || !tableContainerRef.current || typeof MutationObserver !== 'function') {
      return undefined
    }

    const mutationObserver = new MutationObserver(scheduleRefreshTableScroller)
    mutationObserver.observe(tableContainerRef.current, {
      childList: true,
      subtree: true,
    })

    return () => {
      cancelScheduledRefresh()
      mutationObserver.disconnect()
    }
  }, [cancelScheduledRefresh, disabled, scheduleRefreshTableScroller, tableContainerRef])

  React.useEffect(() => cancelScheduledRefresh, [cancelScheduledRefresh])

  React.useEffect(() => {
    const { scroller: tableScroller, content: tableScrollerContent } = scrollerBinding

    if (disabled) {
      updateMetrics(null)
      return undefined
    }

    if (!tableScroller) {
      return undefined
    }

    const syncFromTable = () => {
      if (isSyncingRef.current || !scrollbarRef.current) {
        return
      }

      isSyncingRef.current = true
      scrollbarRef.current.scrollLeft = tableScroller.scrollLeft
      releaseSyncLock()
    }

    tableScroller.addEventListener('scroll', syncFromTable, { passive: true })
    window.addEventListener('resize', scheduleRefreshTableScroller)

    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(() => updateMetrics(tableScroller)) : undefined
    resizeObserver?.observe(tableScroller)
    if (tableScrollerContent) {
      resizeObserver?.observe(tableScrollerContent)
    }

    updateMetrics(tableScroller)

    return () => {
      tableScroller.removeEventListener('scroll', syncFromTable)
      window.removeEventListener('resize', scheduleRefreshTableScroller)
      resizeObserver?.disconnect()
    }
  }, [disabled, releaseSyncLock, scheduleRefreshTableScroller, scrollerBinding, updateMetrics])

  const syncFromScrollbar = React.useCallback(() => {
    const tableScroller = tableScrollerRef.current

    if (isSyncingRef.current || !tableScroller || !scrollbarRef.current) {
      return
    }

    isSyncingRef.current = true
    tableScroller.scrollLeft = scrollbarRef.current.scrollLeft
    releaseSyncLock()
  }, [releaseSyncLock])

  if (!metrics.visible) {
    return null
  }

  return (
    <HorizontalScrollbar
      ref={scrollbarRef}
      aria-hidden="true"
      data-testid="enriched-table-horizontal-scrollbar"
      onScroll={syncFromScrollbar}
    >
      <HorizontalScrollbarInner style={{ width: metrics.scrollWidth }} />
    </HorizontalScrollbar>
  )
}
