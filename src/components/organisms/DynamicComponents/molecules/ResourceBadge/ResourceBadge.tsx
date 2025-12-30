/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { hslFromString } from 'utils/hslFromString'
import { getUppercase } from 'utils/getUppercase'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll } from '../utils'
import { Styled } from './styled'

export const ResourceBadge: FC<{ data: TDynamicComponentsAppTypeMap['ResourceBadge'] }> = ({ data }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    value,
    abbreviation,
    style,
  } = data

  const { data: multiQueryData, isLoading, isError, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()
  const theme = useTheme()

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

  const parsedValue = parseAll({
    text: value,
    replaceValues,
    multiQueryData,
  })

  const parsedAbbreviation = abbreviation
    ? parseAll({
        text: abbreviation,
        replaceValues,
        multiQueryData,
      })
    : getUppercase(parsedValue)

  const bgColor = hslFromString(parsedValue, theme)

  return (
    <Styled.RoundSpan $bgColor={bgColor} style={style}>
      {parsedAbbreviation}
    </Styled.RoundSpan>
  )
}
