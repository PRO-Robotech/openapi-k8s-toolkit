/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
import React, { FC, useState } from 'react'
import jp from 'jsonpath'
import { Flex, Button, notification, Typography } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { Spoiler } from 'spoiled'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll } from '../utils'
import { Styled } from './styled'
import { decodeIfBase64, resolveMultilineRows } from './utils'

export const SecretBase64Plain: FC<{ data: TDynamicComponentsAppTypeMap['SecretBase64Plain'] }> = ({ data }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    type,
    value,
    reqIndex,
    jsonPathToSecrets,
    base64Value,
    plainTextValue,
    multiline,
    multilineRows,
    shownByDefault,
    hideEye,
    textStyle,
    emptyText,
    containerStyle,
    inputContainerStyle,
    flexProps,
    niceLooking,
    notificationText,
    notificationWidth,
  } = data

  const hiddenDefault = !shownByDefault
  const [hidden, setHidden] = useState(hiddenDefault)
  const [hiddenByKey, setHiddenByKey] = useState<Record<string, boolean>>({})

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
    text: value ?? base64Value ?? plainTextValue ?? 'Value required',
    replaceValues,
    multiQueryData,
  })
  const emptyTextPrepared: string | undefined =
    typeof emptyText === 'string' && emptyText.length > 0
      ? parseAll({
          text: emptyText,
          replaceValues,
          multiQueryData,
        })
      : undefined

  const shouldDecodeSingle = type === 'base64' ? true : type === 'plain' ? false : base64Value !== undefined
  const decodedText = decodeIfBase64(parsedText, shouldDecodeSingle)

  const copyToClipboard = async (valueToCopy: string) => {
    try {
      if (valueToCopy !== null && valueToCopy !== undefined) {
        await navigator.clipboard.writeText(valueToCopy)
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

  const handleInputClick = async (
    e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>,
    isHidden: boolean,
    valueToCopy: string,
  ) => {
    if (isHidden) {
      return
    }

    e.currentTarget.focus()
    e.currentTarget.select()
    await copyToClipboard(valueToCopy)
  }

  const useNiceLooking = !!niceLooking && !multiline

  const renderSecretField = ({
    value,
    isHidden,
    onToggle,
  }: {
    value: string
    isHidden: boolean
    onToggle: () => void
  }) => {
    const effectiveHidden = hideEye ? false : isHidden
    const shownValue = useNiceLooking ? value : effectiveHidden ? '' : value
    const resolvedMultilineRows = resolveMultilineRows(value, multilineRows)

    return (
      <Flex gap={8} {...flexProps}>
        <Styled.NoSelect style={inputContainerStyle}>
          {useNiceLooking ? (
            <Spoiler theme={theme} hidden={effectiveHidden}>
              <Styled.DisabledInput
                $hidden={effectiveHidden}
                onClick={e => handleInputClick(e, effectiveHidden, value)}
                value={shownValue}
                readOnly
              />
            </Spoiler>
          ) : multiline ? (
            <Styled.DisabledTextArea
              $hidden={effectiveHidden}
              onClick={e => handleInputClick(e, effectiveHidden, value)}
              value={shownValue}
              rows={resolvedMultilineRows}
              readOnly
            />
          ) : (
            <Styled.DisabledInput
              $hidden={effectiveHidden}
              onClick={e => handleInputClick(e, effectiveHidden, value)}
              value={shownValue}
              readOnly
            />
          )}
        </Styled.NoSelect>
        {!hideEye && (
          <Button type="text" onClick={onToggle}>
            {isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </Button>
        )}
      </Flex>
    )
  }

  if (reqIndex && jsonPathToSecrets) {
    const reqIndexPrepared = parseAll({ text: reqIndex, replaceValues, multiQueryData })
    const jsonPathToSecretsPrepared = parseAll({ text: jsonPathToSecrets, replaceValues, multiQueryData })
    const jsonRoot = multiQueryData[`req${reqIndexPrepared}`]

    if (jsonRoot === undefined) {
      return <div>No root for json path</div>
    }

    const pathResults = jp.query(jsonRoot || {}, `$${jsonPathToSecretsPrepared}`)
    const objectToRender =
      pathResults.find(item => item !== null && typeof item === 'object' && !Array.isArray(item)) || null
    const secretsEntries = objectToRender ? Object.entries(objectToRender as Record<string, unknown>) : []

    if (secretsEntries.length === 0) {
      return (
        <div style={containerStyle}>
          <Styled.NotificationOverrides />
          {emptyTextPrepared && <Typography.Text style={textStyle}>{emptyTextPrepared}</Typography.Text>}
          {contextHolder}
        </div>
      )
    }

    return (
      <div style={containerStyle}>
        <Styled.NotificationOverrides />
        <Flex vertical gap={8}>
          {secretsEntries.map(([key, rawValue]) => {
            const parsedValue = parseAll({
              text: typeof rawValue === 'string' ? rawValue : String(rawValue),
              replaceValues,
              multiQueryData,
            })
            const shouldDecodeObject = type !== 'plain'
            const secretValue = decodeIfBase64(parsedValue, shouldDecodeObject)
            const hiddenForKey = hiddenByKey[key] ?? hiddenDefault

            return (
              <div key={key}>
                <Typography.Text strong style={textStyle}>
                  {key}
                </Typography.Text>
                {renderSecretField({
                  value: secretValue,
                  isHidden: hiddenForKey,
                  onToggle: () =>
                    setHiddenByKey(prevState => ({
                      ...prevState,
                      [key]: !(prevState[key] ?? hiddenDefault),
                    })),
                })}
              </div>
            )
          })}
        </Flex>
        {contextHolder}
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <Styled.NotificationOverrides />
      {renderSecretField({
        value: decodedText,
        isHidden: hidden,
        onToggle: () => setHidden(!hidden),
      })}
      {contextHolder}
    </div>
  )
}
