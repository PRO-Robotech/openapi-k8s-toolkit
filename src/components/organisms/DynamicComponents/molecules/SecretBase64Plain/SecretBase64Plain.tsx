/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
import React, { FC, useState, useRef } from 'react'
import { Flex, Button, notification } from 'antd'
import type { InputRef } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { Spoiler } from 'spoiled'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/themeContext'
import { parseAll } from '../utils'
import { Styled } from './styled'

export const SecretBase64Plain: FC<{ data: TDynamicComponentsAppTypeMap['SecretBase64Plain'] }> = ({ data }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    base64Value,
    plainTextValue,
    containerStyle,
    inputContainerStyle,
    flexProps,
    niceLooking,
    notificationText,
    notificationWidth,
  } = data

  const [hidden, setHidden] = useState(true)
  const inputRef = useRef<InputRef | null>(null)

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

  return (
    <div style={containerStyle}>
      <Styled.NotificationOverrides />
      <Flex gap={8} {...flexProps}>
        <Styled.NoSelect style={inputContainerStyle}>
          {niceLooking ? (
            <Spoiler theme={theme} hidden={hidden}>
              <Styled.DisabledInput
                $hidden={hidden}
                ref={inputRef}
                onClick={() => {
                  if (!hidden) {
                    inputRef.current?.focus({
                      cursor: 'all',
                    })
                    copyToClipboard()
                  }
                }}
                value={decodedText}
              />
            </Spoiler>
          ) : (
            <Styled.DisabledInput
              $hidden={hidden}
              ref={inputRef}
              onClick={() => {
                if (!hidden) {
                  inputRef.current?.focus({
                    cursor: 'all',
                  })
                  copyToClipboard()
                }
              }}
              value={hidden ? '' : decodedText}
            />
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
