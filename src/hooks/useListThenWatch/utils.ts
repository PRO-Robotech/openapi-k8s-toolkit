import { TSingleResource } from 'localTypes/k8s'

// Unique key per event for stable list rendering and updates
export const eventKey = (e: TSingleResource) => {
  const n = e.metadata?.name ?? ''
  const ns = e.metadata?.namespace ?? ''
  return `${ns}/${n}`
}

// Compare resourceVersions safely (string-based)
export const compareRV = (a: string, b: string): number => {
  if (a.length !== b.length) return a.length > b.length ? 1 : -1
  // eslint-disable-next-line no-nested-ternary
  return a > b ? 1 : a < b ? -1 : 0
}

type WithRV = { metadata?: { resourceVersion?: string } }

export const getRV = (item: WithRV): string | undefined => item?.metadata?.resourceVersion

// ✅ Pure functional + no restricted syntax
export const getMaxRV = <T extends WithRV>(items: ReadonlyArray<T>): string | undefined => {
  const rvs = items
    .map(getRV)
    .filter((v): v is string => Boolean(v))
    .sort(compareRV)
  return rvs.length ? rvs[rvs.length - 1] : undefined
}
