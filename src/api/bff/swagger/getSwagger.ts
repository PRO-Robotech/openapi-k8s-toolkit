import axios, { AxiosResponse } from 'axios'
import { TGetDerefedSwaggerRes } from 'localTypes/bff/swagger'

export const getSwagger = async ({ cluster }: { cluster: string }): Promise<AxiosResponse<TGetDerefedSwaggerRes>> => {
  return axios.get<TGetDerefedSwaggerRes>(`/api/clusters/${cluster}/openapi-bff/swagger/swagger/${cluster}`)
}
