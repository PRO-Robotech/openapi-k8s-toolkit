import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import type { TUseK8sSmartResourceParams } from 'hooks/useK8sSmartResource'
import { ManageableSidebar } from '../ManageableSidebar'
import { TSidebarResponse } from './types'
import { collectLinksWithResourcesList, prepareDataForManageableSidebar } from './utils'

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

type TResourcesDataEntry = {
  items: Record<string, unknown>[]
  isLoading: boolean
}

const ResourcesListFetcher: FC<{
  nodePath: string
  params: TUseK8sSmartResourceParams<{ items?: Record<string, unknown>[] }>
  onUpdate: (args: { nodePath: string; entry: TResourcesDataEntry }) => void
}> = ({ nodePath, params, onUpdate }) => {
  const { data, isLoading } = useK8sSmartResource<{ items?: Record<string, unknown>[] }>(params)

  useEffect(() => {
    const maybeItems = data?.items
    const preparedItems = Array.isArray(maybeItems) ? maybeItems : []

    onUpdate({
      nodePath,
      entry: {
        items: preparedItems,
        isLoading,
      },
    })
  }, [nodePath, data?.items, isLoading, onUpdate])

  return null
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
  const safeMultiQueryData = useMemo(() => multiQueryData || {}, [multiQueryData])

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

  const parsedData = rawData?.items.map(({ spec }) => spec) || []

  const foundData =
    parsedData.find(el => el.id === idToCompare) ||
    (fallbackIdToCompare ? parsedData.find(el => el.id === fallbackIdToCompare) : undefined)

  const linksWithResourcesList = useMemo(
    () =>
      collectLinksWithResourcesList({
        items: foundData?.menuItems || [],
        replaceValues,
        multiQueryData: safeMultiQueryData,
        isEnabled,
      }),
    [foundData?.menuItems, replaceValues, safeMultiQueryData, isEnabled],
  )

  const [resourcesByPath, setResourcesByPath] = useState<Record<string, TResourcesDataEntry>>({})

  useEffect(() => {
    setResourcesByPath(prev => {
      const next = linksWithResourcesList.reduce<Record<string, TResourcesDataEntry>>(
        (acc, { nodePath, k8sParams }) => {
          acc[nodePath] = prev[nodePath] || { items: [], isLoading: Boolean(k8sParams.isEnabled) }
          return acc
        },
        {},
      )
      return next
    })
  }, [linksWithResourcesList])

  const handleResourceUpdate = useCallback(({ nodePath, entry }: { nodePath: string; entry: TResourcesDataEntry }) => {
    setResourcesByPath(prev => {
      const previous = prev[nodePath]
      if (previous && previous.items === entry.items && previous.isLoading === entry.isLoading) {
        return prev
      }
      return { ...prev, [nodePath]: entry }
    })
  }, [])

  const isResourcesLoading = linksWithResourcesList.some(({ nodePath, k8sParams }) => {
    if (!k8sParams.isEnabled) {
      return false
    }
    return resourcesByPath[nodePath]?.isLoading !== false
  })

  if (isResourcesLoading) {
    return (
      <>
        {linksWithResourcesList.map(({ nodePath, k8sParams }) => (
          <ResourcesListFetcher key={nodePath} nodePath={nodePath} params={k8sParams} onUpdate={handleResourceUpdate} />
        ))}
        <Spin />
      </>
    )
  }

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

  if (!parsedData || parsedData.length === 0) {
    return null
  }

  if (!foundData) {
    return null
  }

  const resourcesListData = linksWithResourcesList.reduce<Record<string, { items?: Record<string, unknown>[] }>>(
    (acc, { nodePath }) => {
      const result = resourcesByPath[nodePath]
      acc[nodePath] = {
        items: Array.isArray(result?.items) ? result.items : [],
      }
      return acc
    },
    {},
  )

  const result = prepareDataForManageableSidebar({
    data: parsedData,
    replaceValues,
    multiQueryData: safeMultiQueryData,
    pathname,
    searchParams,
    idToCompare,
    fallbackIdToCompare,
    currentTags,
    resourcesListData,
  })

  if (!result) {
    return null
  }

  return (
    <>
      {linksWithResourcesList.map(({ nodePath, k8sParams }) => (
        <ResourcesListFetcher key={nodePath} nodePath={nodePath} params={k8sParams} onUpdate={handleResourceUpdate} />
      ))}
      <ManageableSidebar data={result} noMarginTop={noMarginTop} />
    </>
  )
}
