import axios from 'axios'
import {
  TCheckIfApiInstanceNamespaceScopedReq,
  TCheckIfApiInstanceNamespaceScopedRes,
  TCheckIfBuiltInInstanceNamespaceScopedReq,
  TCheckIfBuiltInInstanceNamespaceScopedRes,
} from 'localTypes/bff/scopes'

export const checkIfApiInstanceNamespaceScoped = async ({
  plural,
  apiGroup,
  apiVersion,
  cluster,
}: {
  plural: string
  apiGroup: string
  apiVersion: string
  cluster: string
}) => {
  const payload: TCheckIfApiInstanceNamespaceScopedReq = {
    plural,
    apiGroup,
    apiVersion,
    cluster,
  }
  const { data } = await axios.post<TCheckIfApiInstanceNamespaceScopedRes>(
    `/api/clusters/${cluster}/openapi-bff/scopes/checkScopes/checkIfApiNamespaceScoped`,
    payload,
  )

  return data
}

export const checkIfBuiltInInstanceNamespaceScoped = async ({
  plural,
  cluster,
}: {
  plural: string
  cluster: string
}) => {
  const payload: TCheckIfBuiltInInstanceNamespaceScopedReq = {
    plural,
    cluster,
  }
  const { data } = await axios.post<TCheckIfBuiltInInstanceNamespaceScopedRes>(
    `/api/clusters/${cluster}/openapi-bff/scopes/checkScopes/checkIfBuiltInNamespaceScoped`,
    payload,
  )

  return data
}
