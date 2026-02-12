/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
import React, { FC, useState } from 'react'
import { Flex, Button, notification } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { Spoiler } from 'spoiled'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll } from '../utils'
import { Styled } from './styled'

export const SecretBase64Plain: FC<{ data: TDynamicComponentsAppTypeMap['SecretBase64Plain'] }> = ({ data }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    base64Value,
    plainTextValue,
    multiline,
    multilineRows,
    containerStyle,
    inputContainerStyle,
    flexProps,
    niceLooking,
    notificationText,
    notificationWidth,
  } = data

  const [hidden, setHidden] = useState(true)

  const [notificationApi, contextHolder] = notification.useNotification()

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

  const parsedText = parseAll({
    text: base64Value || plainTextValue || 'Oneof required',
    replaceValues,
    multiQueryData,
  })

  const decodedText = base64Value ? atob(parsedText) : parsedText

  const copyToClipboard = async () => {
    try {
      if (decodedText !== null && decodedText !== undefined) {
        await navigator.clipboard.writeText(decodedText)
        notificationApi.info({
          // message: `Copied: ${decodedText.substring(0, 5)}...`,
          message: notificationText || 'Text copied to clipboard',
          placement: 'bottomRight',
          closeIcon: null,
          style: {
            width: notificationWidth || '300px',
          },
          className: 'no-message-notif',
        })
      } else {
        // messageApi.error('Failed to copy text')
        console.log('Failed to copy text')
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      // messageApi.error('Failed to copy text')
    }
  }

  const handleInputClick = async (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (hidden) {
      return
    }

    e.currentTarget.focus()
    e.currentTarget.select()
    await copyToClipboard()
  }

  const useNiceLooking = !!niceLooking && !multiline
  const shownValue = useNiceLooking ? decodedText : hidden ? '' : decodedText
  const computedMultilineRows = Math.min(12, Math.max(3, decodedText.split(/\r\n|\r|\n/).length))
  const resolvedMultilineRows =
    typeof multilineRows === 'number' && Number.isFinite(multilineRows)
      ? Math.min(30, Math.max(1, Math.floor(multilineRows)))
      : computedMultilineRows

  return (
    <div style={containerStyle}>
      <Styled.NotificationOverrides />
      <Flex gap={8} {...flexProps}>
        <Styled.NoSelect style={inputContainerStyle}>
          {useNiceLooking ? (
            <Spoiler theme={theme} hidden={hidden}>
              <Styled.DisabledInput $hidden={hidden} onClick={handleInputClick} value={shownValue} readOnly />
            </Spoiler>
          ) : multiline ? (
            <Styled.DisabledTextArea
              $hidden={hidden}
              onClick={handleInputClick}
              value={shownValue}
              rows={resolvedMultilineRows}
              readOnly
            />
          ) : (
            <Styled.DisabledInput $hidden={hidden} onClick={handleInputClick} value={shownValue} readOnly />
          )}
        </Styled.NoSelect>
        <Button type="text" onClick={() => setHidden(!hidden)}>
          {hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        </Button>
      </Flex>
      {contextHolder}
    </div>
  )
}
