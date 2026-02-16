/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { isExternalHref } from './utils'

export const AntdLink: FC<{ data: TDynamicComponentsAppTypeMap['antdLink']; children?: any }> = ({
  data,
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, text, href, ...linkProps } = data

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const textPrepared = parseAll({ text, replaceValues, multiQueryData })

  const hrefPrepared = parseAll({ text: href, replaceValues, multiQueryData })
  const isExternal = isExternalHref(hrefPrepared)

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <Typography.Link
      href={hrefPrepared}
      onClick={e => {
        if (isExternal) {
          return
        }

        e.preventDefault()
        navigate(hrefPrepared)
      }}
      {...linkProps}
    >
      {textPrepared}
      {children}
    </Typography.Link>
  )
}
