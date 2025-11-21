import axios, { AxiosResponse } from 'axios'

export const getBuiltinResources = async <T>({
  cluster,
  namespace,
  plural,
  name,
  labels,
  fields,
  limit,
}: {
  cluster: string
  namespace?: string
  plural: string
  name?: string
  labels?: string[]
  fields?: string[]
  limit: string | null
}): Promise<AxiosResponse<T>> => {
  const params = new URLSearchParams()
  if (limit !== null) {
    params.set('limit', limit)
  }
  if (labels && labels.length > 0) {
    params.set('labelSelector', labels.join(','))
  }
  if (fields && fields.length > 0) {
    params.set('fieldSelector', fields.join(','))
  }
  const searchParams = params.toString()
  return axios.get(
    `/api/clusters/${cluster}/k8s/api/v1${namespace ? `/namespaces/${namespace}` : ''}/${plural}${
      name ? `/${name}` : ''
    }${searchParams.length > 0 ? `?${searchParams}` : ''}`,
  )
}

export const getBuiltinResourceSingle = async <T>({
  cluster,
  namespace,
  plural,
  name,
}: {
  cluster: string
  namespace?: string
  plural: string
  name: string
}): Promise<AxiosResponse<T>> => {
  return axios.get(
    `/api/clusters/${cluster}/k8s/api/v1${namespace ? `/namespaces/${namespace}` : ''}/${plural}/${name}`,
  )
}
