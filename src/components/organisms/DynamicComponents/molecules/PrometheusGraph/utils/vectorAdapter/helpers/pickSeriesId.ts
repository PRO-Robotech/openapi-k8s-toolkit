/* eslint-disable no-underscore-dangle */

// Helper: consistent series id selection
export const pickSeriesId = (metric: Record<string, string>, idx: number) =>
  metric.container || metric.pod || metric.instance || metric.job || metric.__name__ || `series_${idx}`
