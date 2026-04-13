/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll } from '../utils'
import { useAutoPerRequestError } from '../hooks/useAutoPerRequestError'
import { PerRequestError } from '../PerRequestError'

export const DefaultIframe: FC<{
  data: TDynamicComponentsAppTypeMap['DefaultIframe']
  children?: any
}> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    src,
    title,
    ...props
  } = data

  const theme = useTheme()

  const { data: multiQueryData, isLoading: isMultiQueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()
  const { shouldShowError, errorToShow } = useAutoPerRequestError({ ...data })

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const replaceValuesWithTheme = { ...replaceValues, theme }

  const srcPrepared = src ? parseAll({ text: src, replaceValues: replaceValuesWithTheme, multiQueryData }) : undefined

  const titlePrepared = title
    ? parseAll({ text: title, replaceValues: replaceValuesWithTheme, multiQueryData })
    : undefined

  return (
    <>
      <iframe src={srcPrepared} title={titlePrepared} {...props} />
      {children}
    </>
  )
}
