import axios from 'axios'
import {
  TFilterIfApiInstanceNamespaceScopedReq,
  TFilterIfApiInstanceNamespaceScopedRes,
  TFilterIfBuiltInInstanceNamespaceScopedReq,
  TFilterIfBuiltInInstanceNamespaceScopedRes,
} from 'localTypes/bff/scopes'
import { TApiGroupResourceTypeList, TBuiltinResourceTypeList } from 'localTypes/k8s'

export const filterIfApiInstanceNamespaceScoped = async ({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  data,
}: {
  namespace?: string
  data?: TApiGroupResourceTypeList
  apiGroup: string
  apiVersion: string
  cluster: string
}) => {
  const payload: TFilterIfApiInstanceNamespaceScopedReq = {
    cluster,
    namespace,
    apiGroup,
    apiVersion,
    data,
  }
  const result = await axios.post<TFilterIfApiInstanceNamespaceScopedRes>(
    `/api/clusters/${cluster}/openapi-bff/scopes/filterScopes/filterIfApiNamespaceScoped`,
    payload,
  )

  return result.data
}

export const filterIfBuiltInInstanceNamespaceScoped = async ({
  cluster,
  namespace,
  data,
}: {
  cluster: string
  namespace?: string
  data?: TBuiltinResourceTypeList
}) => {
  const payload: TFilterIfBuiltInInstanceNamespaceScopedReq = {
    cluster,
    namespace,
    data,
  }
  const result = await axios.post<TFilterIfBuiltInInstanceNamespaceScopedRes>(
    `/api/clusters/${cluster}/openapi-bff/scopes/filterScopes/filterIfBuiltInNamespaceScoped`,
    payload,
  )

  return result.data
}
