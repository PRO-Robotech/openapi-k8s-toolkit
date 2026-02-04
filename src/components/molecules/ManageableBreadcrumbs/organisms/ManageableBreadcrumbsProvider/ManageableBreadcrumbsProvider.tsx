import React, { FC } from 'react'
// import { Breadcrumb, Spin } from 'antd'
import { Spin } from 'antd'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { ManageableBreadcrumbs } from '../ManageableBreadcrumbs'
import { TBreadcrumbResponse } from './types'
import { prepareDataForManageableBreadcrumbs } from './utils'
import { Styled } from './styled'

export type TManageableBreadcrumbsProviderProps = {
  cluster: string
  apiGroup: string
  apiVersion: string
  plural: string
  isEnabled?: boolean
  replaceValues: Record<string, string | undefined>
  pathname: string
  idToCompare: string
  fallbackIdToCompare?: string
}

export const ManageableBreadcrumbsProvider: FC<TManageableBreadcrumbsProviderProps> = ({
  cluster,
  apiGroup,
  apiVersion,
  plural,
  isEnabled,
  replaceValues,
  pathname,
  idToCompare,
  fallbackIdToCompare,
}) => {
  const {
    data: rawData,
    isError: rawDataError,
    isLoading: rawDataLoading,
  } = useK8sSmartResource<TBreadcrumbResponse>({
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
    return (
      <Styled.HeightDiv>
        <Spin />
      </Styled.HeightDiv>
    )
  }

  if (!rawData) {
    return null
  }

  const parsedData = rawData?.items.map(({ spec }) => spec)

  if (!parsedData) {
    return null
  }

  const result = prepareDataForManageableBreadcrumbs({
    data: parsedData,
    replaceValues,
    pathname,
    idToCompare,
    fallbackIdToCompare,
  })

  if (!result) {
    return <Styled.HeightDiv />
  }

  return <ManageableBreadcrumbs key={JSON.stringify(idToCompare)} data={result} />
}
