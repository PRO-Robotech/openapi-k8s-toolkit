export type TPrometheusRangeResponse = {
  status: 'success' | 'error'
  data: {
    resultType: 'matrix'
    result: {
      metric: Record<string, string>
      values: [number, string][]
    }[]
  }
}
