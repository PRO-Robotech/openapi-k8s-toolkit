/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { notification, Switch } from 'antd'
import { patchEntryWithReplaceOp, patchEntryWithDeleteOp } from 'api/forms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'

export const Toggler: FC<{ data: TDynamicComponentsAppTypeMap['Toggler']; children?: any }> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToValue,
    criteria,
    notificationSuccessMessage,
    notificationSuccessMessageDescription,
    notificationErrorMessage,
    notificationErrorMessageDescription,
    containerStyle,
    endpoint,
    pathToValue,
    valueToSubmit,
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

  let valueToSwitch: boolean = false
  if (criteria.type === 'forSuccess') {
    if (criteria.operator === 'exists') {
      valueToSwitch = valueToCompare !== undefined
    }
    if (criteria.operator === 'equals') {
      valueToSwitch = String(valueToCompare) === criteria.valueToCompare
    }
  }
  if (criteria.type === 'forError') {
    if (criteria.operator === 'exists') {
      valueToSwitch = !valueToCompare
    }
    if (criteria.operator === 'equals') {
      valueToSwitch = String(valueToCompare) !== criteria.valueToCompare
    }
  }

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

  const toggleOn = () => {
    patchEntryWithReplaceOp({
      endpoint: endpointPrepared,
      pathToValue: pathToValuePrepared,
      body: valueToSubmit.onValue,
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

  const toggleOff = () => {
    if (valueToSubmit.offValue !== undefined) {
      patchEntryWithReplaceOp({
        endpoint: endpointPrepared,
        pathToValue: pathToValuePrepared,
        body: valueToSubmit.offValue,
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
    if (valueToSubmit.toRemoveWhenOff) {
      patchEntryWithDeleteOp({
        endpoint: endpointPrepared,
        pathToValue: pathToValuePrepared,
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
  }

  return (
    <div style={containerStyle}>
      <Switch
        value={valueToSwitch}
        onChange={checked => {
          if (checked) {
            toggleOn()
          } else {
            toggleOff()
          }
        }}
      />
      {children}
      {contextHolder}
    </div>
  )
}
