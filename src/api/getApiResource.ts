import axios, { AxiosResponse } from 'axios'

export const getApiResources = async <T>({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  plural,
  name,
  labels,
  fields,
  limit,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
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
    `/api/clusters/${cluster}/k8s/apis/${apiGroup}/${apiVersion}${
      namespace ? `/namespaces/${namespace}` : ''
    }/${plural}${name ? `/${name}` : ''}${searchParams.length > 0 ? `?${searchParams}` : ''}`,
  )
}

export const getApiResourceSingle = async <T>({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  plural,
  name,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
  plural: string
  name: string
}): Promise<AxiosResponse<T>> => {
  return axios.get(
    `/api/clusters/${cluster}/k8s/apis/${apiGroup}/${apiVersion}${
      namespace ? `/namespaces/${namespace}` : ''
    }/${plural}/${name}`,
  )
}
