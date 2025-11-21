import axios, { AxiosResponse } from 'axios'

export const getBuiltinResourceTypes = async <T>({ cluster }: { cluster: string }): Promise<AxiosResponse<T>> => {
  return axios.get(`/api/clusters/${cluster}/k8s/api/v1`)
}
