/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Typography } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/multiQueryProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'
import { getResult } from './utils'

export const StatusText: FC<{ data: TDynamicComponentsAppTypeMap['StatusText']; children?: any }> = ({
  data,
  children,
}) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    value,
    criteriaSuccess,
    criteriaError,
    valueToCompareSuccess,
    valueToCompareError,
    successText,
    errorText,
    fallbackText,
    ...props
  } = data

  const { data: multiQueryData, isLoading: isMultiqueryLoading, isError, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const successTextPrepared = parseAll({ text: successText, replaceValues, multiQueryData })
  const errorTextPrepared = parseAll({ text: errorText, replaceValues, multiQueryData })
  const fallbackTextPrepared = parseAll({ text: fallbackText, replaceValues, multiQueryData })

  const valuePrepared = parseAll({ text: value, replaceValues, multiQueryData })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  if (isError) {
    return (
      <div>
        <h4>Errors:</h4>
        {/* eslint-disable-next-line react/no-array-index-key */}
        <ul>{errors.map((e, i) => e && <li key={i}>{e.message}</li>)}</ul>
      </div>
    )
  }

  const { type, text } = getResult({
    valuePrepared,
    criteriaSuccess,
    criteriaError,
    valueToCompareSuccess,
    valueToCompareError,
    successText: successTextPrepared,
    errorText: errorTextPrepared,
    fallbackText: fallbackTextPrepared,
  })

  return (
    <Typography.Text type={type} {...props}>
      {text}
      {children}
    </Typography.Text>
  )
}
