/* eslint-disable no-nested-ternary */

export const formatTimestamp = (raw: unknown): string => {
  const ts = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN

  if (!Number.isFinite(ts)) {
    return ''
  }

  return new Date(ts).toLocaleString()
}
