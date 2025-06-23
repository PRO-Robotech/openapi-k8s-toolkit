/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { ManageableSidebarWithDataProvider } from 'components/molecules'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'

export const SidebarProvider: FC<{ data: TDynamicComponentsAppTypeMap['SidebarProvider']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...props } = data

  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  return <ManageableSidebarWithDataProvider replaceValues={replaceValues} {...props} />
}
