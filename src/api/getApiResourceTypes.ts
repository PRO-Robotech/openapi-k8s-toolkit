import axios, { AxiosResponse } from 'axios'

export const getApiResourceTypes = async <T>({ cluster }: { cluster: string }): Promise<AxiosResponse<T>> => {
  return axios.get(`/api/clusters/${cluster}/k8s/apis/`)
}

export const getApiResourceTypesByApiGroup = async <T>({
  cluster,
  apiGroup,
  apiVersion,
}: {
  cluster: string
  apiGroup: string
  apiVersion: string
}): Promise<AxiosResponse<T>> => {
  return axios.get(`/api/clusters/${cluster}/k8s/apis/${apiGroup}/${apiVersion}/`)
}
