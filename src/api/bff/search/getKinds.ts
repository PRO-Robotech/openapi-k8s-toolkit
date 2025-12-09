import axios from 'axios'
import { TKindIndex } from 'localTypes/bff/search'

export const getKinds = async ({ cluster }: { cluster: string }) => {
  return axios.get<TKindIndex>(`/api/clusters/${cluster}/openapi-bff/search/kinds/getKinds`)
}
