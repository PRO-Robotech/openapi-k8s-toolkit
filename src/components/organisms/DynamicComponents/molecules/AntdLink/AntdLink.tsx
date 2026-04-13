/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Typography, Tooltip } from 'antd'
import { useNavigate } from 'react-router-dom'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { useAutoPerRequestError } from '../hooks/useAutoPerRequestError'
import { PerRequestError } from '../PerRequestError'
import { isExternalHref } from './utils'

export const AntdLink: FC<{ data: TDynamicComponentsAppTypeMap['antdLink']; children?: any }> = ({
  data,
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()
  const { shouldShowError, errorToShow } = useAutoPerRequestError({ ...data })

  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, text, href, title, ...linkProps } = data

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const textPrepared = parseAll({ text, replaceValues, multiQueryData })
  const tooltipPrepared =
    typeof title === 'string' ? parseAll({ text: title, replaceValues, multiQueryData }) : undefined

  const hrefPrepared = parseAll({ text: href, replaceValues, multiQueryData })
  const isExternal = isExternalHref(hrefPrepared)

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  const content = (
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

  if (tooltipPrepared) {
    return <Tooltip title={tooltipPrepared}>{content}</Tooltip>
  }

  return content
}
