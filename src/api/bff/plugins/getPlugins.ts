import axios from 'axios'
import { TPluginManifest } from 'localTypes/bff/plugins'

export const getPlugins = async ({ cluster }: { cluster: string }) => {
  return axios.get<TPluginManifest>(`/api/clusters/${cluster}/openapi-bff/plugins/getPlugins`)
}
