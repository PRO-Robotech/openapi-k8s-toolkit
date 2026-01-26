/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React, { FC, useState } from 'react'
import jp from 'jsonpath'
import { theme as antdtheme, Flex } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { getItemCounterItemsInside } from '../../utils/ItemCounter'
import { getKeyCounterItemsInside } from '../../utils/KeyCounter'
import { parseAll } from '../utils'
import { renderActiveType, renderIcon } from './utils'
import { Styled } from './styled'

export const AggregatedCounterCard: FC<{
  data: TDynamicComponentsAppTypeMap['AggregatedCounterCard']
  children?: any
}> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    text,
    iconBase64Encoded,
    counter,
    activeType,
  } = data
  const { token } = antdtheme.useToken()
  const [open, setOpen] = useState<boolean>(false)

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  if (isMultiQueryErrors) {
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

  const jsonRoot = multiQueryData[`req${counter.props.reqIndex}`]

  if (jsonRoot === undefined) {
    console.log(`Counter: ${id}: No root for json path`)
    return <span style={counter.props.style}>{counter.props.errorText}</span>
  }

  const path = counter.type === 'item' ? counter.props.jsonPathToArray : counter.props.jsonPathToObj
  const anythingForNow = jp.query(jsonRoot || {}, `$${path}`)

  const { counter: counterToDisplay, error: errorParsingCounter } =
    counter.type === 'item' ? getItemCounterItemsInside(anythingForNow) : getKeyCounterItemsInside(anythingForNow)

  if (errorParsingCounter) {
    console.log(`Counter: ${id}: ${errorParsingCounter}`)
    return <span style={counter.props.style}>{counter.props.errorText}</span>
  }

  const parsedText = parseAll({ text, replaceValues, multiQueryData })

  return (
    <>
      <Styled.Card $colorBorder={token.colorBorder} $colorBgContainer={token.colorBgContainer}>
        <Flex gap={4} vertical>
          <Styled.CardTitle $colorTextDescription={token.colorTextDescription}>{parsedText}</Styled.CardTitle>
          <Styled.CardNumber $colorText={token.colorText}>{counterToDisplay}</Styled.CardNumber>
        </Flex>
        <Styled.CardIcon $colorInfo={token.colorInfo}>
          {iconBase64Encoded && renderIcon(iconBase64Encoded, token.colorInfo)}
        </Styled.CardIcon>
      </Styled.Card>
      {renderActiveType(activeType, { open, onClose: () => setOpen(false) })}
      {children}
    </>
  )
}
