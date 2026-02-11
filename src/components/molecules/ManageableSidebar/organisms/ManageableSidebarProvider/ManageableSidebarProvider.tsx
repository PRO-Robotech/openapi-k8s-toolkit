import React, { FC } from 'react'
import { Spin } from 'antd'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { ManageableSidebar } from '../ManageableSidebar'
import { TSidebarResponse } from './types'
import { prepareDataForManageableSidebar } from './utils'

export type TManageableSidebarProviderProps = {
  cluster: string
  apiGroup: string
  apiVersion: string
  plural: string
  isEnabled?: boolean
  replaceValues: Record<string, string | undefined>
  multiQueryData?: Record<string, unknown>
  pathname: string
  searchParams?: string
  idToCompare: string
  fallbackIdToCompare?: string
  currentTags?: string[]
  hidden?: boolean
  noMarginTop?: boolean
}

export const ManageableSidebarProvider: FC<TManageableSidebarProviderProps> = ({
  cluster,
  apiGroup,
  apiVersion,
  plural,
  isEnabled,
  replaceValues,
  multiQueryData,
  pathname,
  searchParams,
  idToCompare,
  fallbackIdToCompare,
  currentTags,
  hidden,
  noMarginTop,
}) => {
  const {
    data: rawData,
    isError: rawDataError,
    isLoading: rawDataLoading,
  } = useK8sSmartResource<TSidebarResponse>({
    cluster,
    apiGroup,
    apiVersion,
    plural,
    isEnabled,
  })

  if (rawDataError) {
    return null
  }

  if (rawDataLoading) {
    return <Spin />
  }

  if (!rawData) {
    return null
  }

  if (hidden) {
    return null
  }

  const parsedData = rawData?.items.map(({ spec }) => spec)

  if (!parsedData) {
    return null
  }

  const result = prepareDataForManageableSidebar({
    data: parsedData,
    replaceValues,
    multiQueryData,
    pathname,
    searchParams,
    idToCompare,
    fallbackIdToCompare,
    currentTags,
  })

  if (!result) {
    return null
  }

  return <ManageableSidebar data={result} noMarginTop={noMarginTop} />
}
