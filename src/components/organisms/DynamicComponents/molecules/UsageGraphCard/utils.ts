export const clampPercent = (value: number, max: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, (value / max) * 100))
}

export const getDefaultQuery = (title?: string) => {
  const label = (title || '').toLowerCase()

  if (label.includes('cpu')) {
    return 'sum(rate(container_cpu_usage_seconds_total[5m]))'
  }

  if (label.includes('memory')) {
    return 'container_memory_usage_bytes'
  }

  if (label.includes('ephemeral') || label.includes('disk') || label.includes('storage')) {
    return 'container_fs_usage_bytes'
  }

  return undefined
}
