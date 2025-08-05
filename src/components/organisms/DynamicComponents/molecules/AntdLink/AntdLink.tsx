/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Typography } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/multiQueryProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'

export const AntdLink: FC<{ data: TDynamicComponentsAppTypeMap['antdLink']; children?: any }> = ({
  data,
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, text, href, ...linkProps } = data

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const textPrepared = parseAll({ text, replaceValues, multiQueryData })

  const hrefPrepared = parseAll({ text: href, replaceValues, multiQueryData })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <Typography.Link href={hrefPrepared} {...linkProps}>
      {textPrepared}
      {children}
    </Typography.Link>
  )
}
