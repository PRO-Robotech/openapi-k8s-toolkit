import { RefObject, useEffect } from 'react'

export const useInfiniteSentinel = (sentinelRef: RefObject<HTMLElement>, hasMore: boolean, onNeedMore: () => void) => {
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return undefined
    const io = new IntersectionObserver(entries => {
      const visible = entries.some(e => e.isIntersecting)
      if (visible && hasMore) onNeedMore()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [sentinelRef, hasMore, onNeedMore])
}
