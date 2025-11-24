import axios, { AxiosResponse } from 'axios'

export const getCrdData = async <T>({
  cluster,
  apiExtensionVersion,
  crdName,
}: {
  cluster: string
  apiExtensionVersion: string
  crdName: string
}): Promise<AxiosResponse<T>> => {
  return axios.get(
    `/api/clusters/${cluster}/k8s/apis/apiextensions.k8s.io/${apiExtensionVersion}/customresourcedefinitions/${crdName}`,
  )
}
