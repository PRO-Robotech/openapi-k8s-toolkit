/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { Typography, Popover, Flex } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { truncate } from '../../utils/truncate'
import { parseAll } from '../utils'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { PerRequestError } from '../PerRequestError'
import { parseLabelsArrayOfAny } from '../../utils/Labels'
import { handleLabelsToSearchParamsLinkClick } from './utils'

export const LabelsToSearchParams: FC<{
  data: TDynamicComponentsAppTypeMap['LabelsToSearchParams']
  children?: any
}> = ({ data, children }) => {
  const renderWithSearchIcon = (content: React.ReactNode) => (
    <Flex align="flex-start" gap={8}>
      <SearchOutlined style={{ marginTop: 4 }} />
      {content}
    </Flex>
  )

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToLabels,
    linkPrefix,
    textLink,
    errorText,
    errorMode = 'errorText',
    maxTextLength,
    renderLabelsAsRows,
    ...linkProps
  } = data
  const navigate = useNavigate()

  const { data: multiQueryData, isLoading: isMultiQueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    return <div>No root for json path</div>
  }

  const anythingForNow = jp.query(jsonRoot || {}, `$${jsonPathToLabels}`)

  const { data: labelsRaw, error: errorArrayOfObjects } = parseLabelsArrayOfAny(anythingForNow)

  const linkPrefixPrepared = parseAll({ text: linkPrefix, replaceValues, multiQueryData })
  const labelsPrefixPrepared = linkPrefixPrepared.includes('?')
    ? `${linkPrefixPrepared}${linkPrefixPrepared.endsWith('?') || linkPrefixPrepared.endsWith('&') ? '' : '&'}labels=`
    : `${linkPrefixPrepared}?labels=`

  const renderErrorFallback = () => {
    if (errorMode === 'default') {
      const fallbackText = textLink || errorText
      const handleDefaultFallbackLinkClick = (e: React.MouseEvent<HTMLElement>) =>
        handleLabelsToSearchParamsLinkClick({
          e,
          hrefPrepared: linkPrefixPrepared,
          navigate,
        })

      return renderWithSearchIcon(
        <Typography.Link href={linkPrefixPrepared} onClick={handleDefaultFallbackLinkClick} {...linkProps}>
          {fallbackText}
          {children}
        </Typography.Link>,
      )
    }

    return renderWithSearchIcon(
      <Typography.Text>
        {errorText}
        {children}
      </Typography.Text>,
    )
  }

  if (!labelsRaw) {
    if (errorArrayOfObjects) {
      // return <div>{errorArrayOfObjects}</div>
      return renderErrorFallback()
    }
    // return <div>Not a valid data structure</div>
    return renderErrorFallback()
  }

  const labels = Object.entries(labelsRaw)
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
  const labelsRows = Object.entries(labelsRaw).map(([key, value]) => `${key}=${value}`)
  const labelsEncoded = encodeURIComponent(labels)
  const hrefPrepared = `${labelsPrefixPrepared}${labelsEncoded}`
  const handleLinkClick = (e: React.MouseEvent<HTMLElement>) =>
    handleLabelsToSearchParamsLinkClick({
      e,
      hrefPrepared,
      navigate,
    })

  if (renderLabelsAsRows) {
    return renderWithSearchIcon(
      <Flex vertical>
        <Typography.Link href={hrefPrepared} onClick={handleLinkClick} {...linkProps}>
          {labelsRows.map((row, index) => (
            <span key={`${row}-${index}`} style={{ display: 'block' }}>
              {index < labelsRows.length - 1 ? `${row},` : row}
            </span>
          ))}
        </Typography.Link>
        {children}
      </Flex>,
    )
  }

  if (maxTextLength && !textLink) {
    const truncatedLabels = maxTextLength ? truncate(labels, maxTextLength) : labels

    return (
      <Popover
        content={
          <Flex vertical gap={8}>
            {Object.entries(labelsRaw).map(([key, value]) => (
              <div key={key}>{`${key}=${value}`}</div>
            ))}
          </Flex>
        }
      >
        {renderWithSearchIcon(
          <Typography.Link href={hrefPrepared} onClick={handleLinkClick} {...linkProps}>
            {truncatedLabels}
            {children}
          </Typography.Link>,
        )}
      </Popover>
    )
  }

  if (textLink) {
    const truncatedTextLink = maxTextLength ? truncate(textLink, maxTextLength) : textLink

    return (
      <Popover
        content={
          <Flex vertical gap={8}>
            {Object.entries(labelsRaw).map(([key, value]) => (
              <div key={key}>{`${key}=${value}`}</div>
            ))}
          </Flex>
        }
      >
        {renderWithSearchIcon(
          <Typography.Link href={hrefPrepared} onClick={handleLinkClick} {...linkProps}>
            {truncatedTextLink}
            {children}
          </Typography.Link>,
        )}
      </Popover>
    )
  }

  return renderWithSearchIcon(
    <Typography.Link href={hrefPrepared} onClick={handleLinkClick} {...linkProps}>
      {textLink || labels}
      {children}
    </Typography.Link>,
  )
}
