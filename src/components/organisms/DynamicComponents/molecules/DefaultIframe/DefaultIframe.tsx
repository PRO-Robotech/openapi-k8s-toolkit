/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll, parseReqIndex } from '../utils'

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

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, hasErrorForReq, getErrorForReq, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  const reqIdx = parseReqIndex(data.reqIndex)
  const shouldShowError = reqIdx != null ? hasErrorForReq(reqIdx) : isMultiQueryErrors

  if (shouldShowError) {
    const errorToShow = reqIdx != null ? getErrorForReq(reqIdx) : errors.find(e => e !== null)
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errorToShow && <li>{typeof errorToShow === 'string' ? errorToShow : errorToShow.message}</li>}</ul>
      </div>
    )
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
