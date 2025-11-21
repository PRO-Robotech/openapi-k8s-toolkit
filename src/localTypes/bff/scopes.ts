import { TApiGroupResourceTypeList, TBuiltinResourceTypeList } from '../k8s'

export type TCheckIfApiInstanceNamespaceScopedReq = {
  plural: string
  apiGroup: string
  apiVersion: string
  cluster: string
}

export type TCheckIfApiInstanceNamespaceScopedRes = {
  isClusterWide: boolean
  isNamespaceScoped: boolean
}

export type TCheckIfBuiltInInstanceNamespaceScopedReq = {
  plural: string
  cluster: string
}

export type TCheckIfBuiltInInstanceNamespaceScopedRes = {
  isClusterWide: boolean
  isNamespaceScoped: boolean
}

export type TFilterIfApiInstanceNamespaceScopedReq = {
  namespace?: string
  data?: TApiGroupResourceTypeList
  apiGroup: string
  apiVersion: string
  cluster: string
}

export type TFilterIfApiInstanceNamespaceScopedRes = TApiGroupResourceTypeList['resources'] | undefined

export type TFilterIfBuiltInInstanceNamespaceScopedReq = {
  namespace?: string
  data?: TBuiltinResourceTypeList
  cluster: string
}

export type TFilterIfBuiltInInstanceNamespaceScopedRes = TBuiltinResourceTypeList['resources'] | undefined
