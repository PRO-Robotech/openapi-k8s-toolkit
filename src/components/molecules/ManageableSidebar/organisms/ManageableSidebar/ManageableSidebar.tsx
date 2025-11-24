import React, { FC, useEffect, useState } from 'react'
import { ItemType } from 'antd/es/menu/interface'
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
