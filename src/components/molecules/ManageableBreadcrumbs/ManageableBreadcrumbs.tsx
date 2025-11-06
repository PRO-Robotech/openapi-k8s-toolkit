import React, { FC } from 'react'
// import { Breadcrumb, Spin } from 'antd'
import { Spin } from 'antd'
import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb'
import { useListWatch } from 'hooks/useListThenWatch'
// import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
// import { TBreadcrumbResponse } from './types'
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
  wsUrl,
  apiGroup,
  apiVersion,
  plural,
  isEnabled,
  replaceValues,
  pathname,
  idToCompare,
}) => {
  // const {
  //   data: rawData,
  //   isError: rawDataError,
  //   isLoading: rawDataLoading,
  // } = useDirectUnknownResource<TBreadcrumbResponse>({
  //   uri,
  //   refetchInterval,
  //   queryKey: ['breadcrumb', uri],
  //   isEnabled,
  // })
  const { state, status, lastError } = useListWatch({
    wsUrl,
    paused: false,
    ignoreRemove: false,
    autoDrain: true,
    preserveStateOnUrlChange: true,
    query: {
      apiVersion,
      apiGroup,
      plural,
    },
    isEnabled,
  })

  const rawDataLoading = status === 'connecting'
  const rawDataError = status === 'closed' && lastError ? lastError : undefined
  const rawData = {
    items: state.order.map(key => {
      const res = state.byKey[key]
      return res
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as { items: any[] }

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
