/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'
import { convertBytes, formatBytesAuto } from './utils'

export const ConverterBytes: FC<{ data: TDynamicComponentsAppTypeMap['ConverterBytes'] }> = ({ data }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    bytesValue,
    unit,
    format,
    precision,
    locale,
    standard,
    notANumberText,
    style,
  } = data

  const { data: multiQueryData, isLoading, isError, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
    )
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const parsedText = parseAll({ text: bytesValue, replaceValues, multiQueryData })

  const parsedNumber = Number(parsedText)

  if (Number.isNaN(parsedNumber)) {
    return <span style={style}>{notANumberText || 'Not a proper value'}</span>
  }

  if (unit) {
    const result = String(convertBytes(parsedNumber, unit, { format, precision, locale }))
    return <span style={style}>{result}</span>
  }

  const result = formatBytesAuto(parsedNumber, { standard, precision, locale })
  return <span style={style}>{result}</span>
}
