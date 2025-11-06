import React, { FC, useEffect, useState } from 'react'
import { Spin } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import { useListWatch } from 'hooks/useListThenWatch'
// import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
// import { TSidebarResponse } from './types'
import { prepareDataForManageableSidebar } from './utils'
import { Styled } from './styled'

export type TManageableSidebarProps = {
  data: { menuItems: ItemType[]; selectedKeys: string[] }
  noMarginTop?: boolean
}

export const ManageableSidebar: FC<TManageableSidebarProps> = ({ data, noMarginTop }) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [openKeys, setOpenKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('menuOpenKeys')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse stored menu keys', error)
      return []
    }
  })

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
    try {
      localStorage.setItem('menuOpenKeys', JSON.stringify(keys))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save menu keys to localStorage', error)
    }
  }

  useEffect(() => {
    setSelectedKeys(data.selectedKeys)
  }, [data.selectedKeys])

  return (
    <Styled.CustomMenu
      selectedKeys={selectedKeys}
      onSelect={() => {}}
      onDeselect={() => {}}
      defaultOpenKeys={data.selectedKeys}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      mode="inline"
      items={data.menuItems}
      $noMarginTop={noMarginTop}
    />
  )
}

export type TManageableSidebarWithDataProviderProps = {
  wsUrl: string
  apiGroup: string
  apiVersion: string
  plural: string
  isEnabled?: boolean
  replaceValues: Record<string, string | undefined>
  pathname: string
  idToCompare: string
  currentTags?: string[]
  hidden?: boolean
  noMarginTop?: boolean
}

export const ManageableSidebarWithDataProvider: FC<TManageableSidebarWithDataProviderProps> = ({
  wsUrl,
  apiGroup,
  apiVersion,
  plural,
  isEnabled,
  replaceValues,
  pathname,
  idToCompare,
  currentTags,
  hidden,
  noMarginTop,
}) => {
  // const {
  //   data: rawData,
  //   isError: rawDataError,
  //   isLoading: rawDataLoading,
  // } = useDirectUnknownResource<TSidebarResponse>({
  //   uri,
  //   refetchInterval,
  //   queryKey: ['sidebar', uri],
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
    pathname,
    idToCompare,
    currentTags,
  })

  if (!result) {
    return null
  }

  return <ManageableSidebar data={result} noMarginTop={noMarginTop} />
}
