/* eslint-disable no-nested-ternary */
export const formatBytes = (raw: unknown): string => {
  const vNum = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN

  if (!Number.isFinite(vNum)) {
    return raw !== undefined && raw !== null ? String(raw) : ''
  }

  if (vNum > 1e9) {
    return `${(vNum / 1e9).toFixed(1)} GB`
  }

  if (vNum > 1e6) {
    return `${(vNum / 1e6).toFixed(1)} MB`
  }

  if (vNum > 1e3) {
    return `${(vNum / 1e3).toFixed(1)} KB`
  }

  return `${vNum.toFixed(0)} B`
}
