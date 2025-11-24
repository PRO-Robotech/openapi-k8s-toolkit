import axios, { AxiosResponse } from 'axios'

export const getCrdResources = async <T>({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  crdName,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
  crdName: string
}): Promise<AxiosResponse<T>> => {
  return axios.get(
    `/api/clusters/${cluster}/k8s/apis/${apiGroup}/${apiVersion}${
      namespace ? `/namespaces/${namespace}` : ''
    }/${crdName}`,
  )
}

export const getCrdResourceSingle = async <T>({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  crdName,
  name,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
  crdName: string
  name: string
}): Promise<AxiosResponse<T>> => {
  return axios.get(
    `/api/clusters/${cluster}/k8s/apis/${apiGroup}/${apiVersion}${
      namespace ? `/namespaces/${namespace}` : ''
    }/${crdName}/${name}`,
  )
}
