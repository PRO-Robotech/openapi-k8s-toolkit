/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { notification, Segmented } from 'antd'
import { patchEntryWithReplaceOp } from 'api/forms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'

export const TogglerSegmented: FC<{ data: TDynamicComponentsAppTypeMap['TogglerSegmented']; children?: any }> = ({
  data,
  children,
}) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToValue,
    notificationSuccessMessage,
    notificationSuccessMessageDescription,
    notificationErrorMessage,
    notificationErrorMessageDescription,
    containerStyle,
    endpoint,
    pathToValue,
    possibleValues,
    valuesMap,
  } = data

  const [api, contextHolder] = notification.useNotification()

  const queryClient = useQueryClient()

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

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    return <div>No root for json path</div>
  }

  const valueToCompare = jp.query(jsonRoot || {}, `$${jsonPathToValue}`)[0]
  const valueToSegmented = valuesMap?.find(el => el.value === valueToCompare)?.renderedValue

  const notificationSuccessMessagePrepared = notificationSuccessMessage
    ? parseAll({
        text: notificationSuccessMessage,
        replaceValues,
        multiQueryData,
      })
    : 'Success'
  const notificationSuccessMessageDescriptionPrepared = notificationSuccessMessageDescription
    ? parseAll({
        text: notificationSuccessMessageDescription,
        replaceValues,
        multiQueryData,
      })
    : 'Success'

  const notificationErrorMessagePrepared = notificationErrorMessage
    ? parseAll({
        text: notificationErrorMessage,
        replaceValues,
        multiQueryData,
      })
    : 'Success'
  const notificationErrorMessageDescriptionPrepared = notificationErrorMessageDescription
    ? parseAll({
        text: notificationErrorMessageDescription,
        replaceValues,
        multiQueryData,
      })
    : 'Success'

  const openNotificationSuccess = () => {
    api.success({
      message: notificationSuccessMessagePrepared,
      description: notificationSuccessMessageDescriptionPrepared,
      placement: 'bottomRight',
    })
  }

  const openNotificationError = () => {
    api.error({
      message: notificationErrorMessagePrepared,
      description: notificationErrorMessageDescriptionPrepared,
      placement: 'bottomRight',
    })
  }

  const endpointPrepared = endpoint
    ? parseAll({ text: endpoint, replaceValues, multiQueryData })
    : 'no-endpoint-provided'

  const pathToValuePrepared = pathToValue
    ? parseAll({ text: pathToValue, replaceValues, multiQueryData })
    : 'no-pathToValue-provided'

  const onChange = (renderedValue: string | number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const valueFromMap = valuesMap?.find(el => el.renderedValue === renderedValue)?.value
    const valueToSend = valueFromMap || renderedValue
    patchEntryWithReplaceOp({
      endpoint: endpointPrepared,
      pathToValue: pathToValuePrepared,
      body: valueToSend,
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['multi'] })
        openNotificationSuccess()
      })
      .catch((error: AxiosError) => {
        openNotificationError()
        // eslint-disable-next-line no-console
        console.error(error)
      })
  }

  return (
    <div style={containerStyle}>
      <Segmented
        options={possibleValues}
        value={valueToSegmented || '~n~e~v~e~r'}
        onChange={value => onChange(value)}
      />
      {children}
      {contextHolder}
    </div>
  )
}
