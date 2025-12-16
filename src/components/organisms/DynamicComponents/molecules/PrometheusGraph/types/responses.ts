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

// Prometheus instant query (scalar) response
export type TPrometheusScalarResponse = {
  status: 'success' | 'error'
  data: {
    resultType: 'scalar'
    result: [number, string] // [unix_seconds, "value"]
  }
}
