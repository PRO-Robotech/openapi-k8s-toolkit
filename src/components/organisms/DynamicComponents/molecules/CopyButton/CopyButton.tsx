/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Button, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'

export const CopyButton: FC<{ data: TDynamicComponentsAppTypeMap['CopyButton']; children?: any }> = ({
  data,
  children,
}) => {
  const {
    copyText,
    successMessage = 'Copied!',
    errorMessage = 'Failed to copy',
    buttonType = 'text',
    tooltip,
    style,
  } = data

  const [messageApi, contextHolder] = message.useMessage()
  const { data: multiQueryData, isLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const copyTextPrepared = parseAll({ text: copyText, replaceValues, multiQueryData })

  const handleCopy = async () => {
    try {
      if (copyTextPrepared !== null && copyTextPrepared !== undefined && copyTextPrepared !== '') {
        await navigator.clipboard.writeText(copyTextPrepared)
        messageApi.success(successMessage)
      } else {
        messageApi.error(errorMessage)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Copy to clipboard failed:', error)
      messageApi.error(errorMessage)
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <>
      {contextHolder}
      <Button
        type={buttonType}
        icon={<CopyOutlined />}
        onClick={handleCopy}
        title={tooltip}
        style={style}
        size="large"
      />
      {children}
    </>
  )
}
