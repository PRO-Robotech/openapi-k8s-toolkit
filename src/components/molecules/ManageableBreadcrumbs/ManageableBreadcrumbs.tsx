import React, { FC } from 'react'
// import { Breadcrumb, Spin } from 'antd'
import { Spin } from 'antd'
import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { TBreadcrumbResponse } from './types'
import { prepareDataForManageableBreadcrumbs } from './utils'
import { CollapsibleBreadcrumb } from './molecules'
import { Styled } from './styled'

export type TManageableBreadcrumbsProps = {
  data: { breadcrumbItems: BreadcrumbItemType[] }
}

export const ManageableBreadcrumbs: FC<TManageableBreadcrumbsProps> = ({ data }) => {
  return (
    <Styled.HeightDiv>
      {/* <Breadcrumb separator=">" items={data.breadcrumbItems} /> */}
      <CollapsibleBreadcrumb items={data.breadcrumbItems} />
    </Styled.HeightDiv>
  )
}

export type TManageableBreadcrumbsWithDataProviderProps = {
  cluster: string
  wsUrl: string
  apiGroup: string
  apiVersion: string
  plural: string
  isEnabled?: boolean
  replaceValues: Record<string, string | undefined>
  pathname: string
  idToCompare: string
}

export const ManageableBreadcrumbsWithDataProvider: FC<TManageableBreadcrumbsWithDataProviderProps> = ({
  cluster,
  apiGroup,
  apiVersion,
  plural,
  isEnabled,
  replaceValues,
  pathname,
  idToCompare,
}) => {
  const {
    data: rawData,
    isError: rawDataError,
    isLoading: rawDataLoading,
  } = useK8sSmartResource<TBreadcrumbResponse>({
    cluster: cluster || '',
    group: apiGroup,
    version: apiVersion,
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
  })

  if (!result) {
    return <Styled.HeightDiv />
  }

  return <ManageableBreadcrumbs data={result} />
}
