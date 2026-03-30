import axios from 'axios'
import { TKindIndex } from 'localTypes/bff/search'

export const getKindsRaw = async ({ cluster }: { cluster: string }) => {
  return axios.get<TKindIndex>(`/api/clusters/${cluster}/openapi-bff/search/kinds/getKindsRaw`)
}
