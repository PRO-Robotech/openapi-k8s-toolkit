// Prometheus instant query (vector) response
export type TPrometheusVectorResponse = {
  status: 'success' | 'error'
  data: {
    resultType: 'vector'
    result: {
      metric: Record<string, string>
      value: [number, string] // [unix_seconds, "value"]
    }[]
  }
}
