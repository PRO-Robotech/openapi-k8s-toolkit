// Prometheus instant query (scalar) response
export type TPrometheusScalarResponse = {
  status: 'success' | 'error'
  data: {
    resultType: 'scalar'
    result: [number, string] // [unix_seconds, "value"]
  }
}
