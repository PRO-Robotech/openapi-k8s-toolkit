/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React, { FC, useState } from 'react'
import jp from 'jsonpath'
import { notification, Flex, Button } from 'antd'
import { EditIcon } from 'components/atoms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'
import { EditModal } from './molecules'
import { getItemsInside } from './utils'

export const Tolerations: FC<{ data: TDynamicComponentsAppTypeMap['Tolerations']; children?: any }> = ({
  data,
  children,
}) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToArray,
    text,
    errorText,
    notificationSuccessMessage,
    notificationSuccessMessageDescription,
    modalTitle,
    modalDescriptionText,
    modalDescriptionTextStyle,
    inputLabel,
    inputLabelStyle,
    containerStyle,
    endpoint,
    pathToValue,
    editModalWidth,
    cols,
  } = data

  const [api, contextHolder] = notification.useNotification()
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

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    console.log(`Item Counter: ${id}: No root for json path`)
    return <div style={containerStyle}>{errorText}</div>
  }

  const anythingForNow = jp.query(jsonRoot || {}, `$${jsonPathToArray}`)

  const { counter, tolerations, error: errorArrayOfObjects } = getItemsInside(anythingForNow)

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
  const modalTitlePrepared = modalTitle ? parseAll({ text: modalTitle, replaceValues, multiQueryData }) : 'Edit'
  const modalDescriptionTextPrepared = modalDescriptionText
    ? parseAll({ text: modalDescriptionText, replaceValues, multiQueryData })
    : undefined
  const inputLabelPrepared = inputLabel ? parseAll({ text: inputLabel, replaceValues, multiQueryData }) : undefined
  const endpointPrepared = endpoint
    ? parseAll({ text: endpoint, replaceValues, multiQueryData })
    : 'no-endpoint-provided'
  const pathToValuePrepared = pathToValue
    ? parseAll({ text: pathToValue, replaceValues, multiQueryData })
    : 'no-pathToValue-provided'

  const openNotificationSuccess = () => {
    api.success({
      message: notificationSuccessMessagePrepared,
      description: notificationSuccessMessageDescriptionPrepared,
      placement: 'bottomRight',
    })
  }

  if (errorArrayOfObjects) {
    console.log(`Item Counter: ${id}: ${errorArrayOfObjects}`)
    return (
      <>
        <div style={containerStyle}>
          <Flex align="center" gap={8}>
            {errorText}
            <Button
              type="text"
              size="small"
              onClick={e => {
                e.stopPropagation()
                setOpen(true)
              }}
              icon={<EditIcon />}
            />
          </Flex>
        </div>
        {contextHolder}
        <EditModal
          open={open}
          close={() => setOpen(false)}
          values={tolerations}
          openNotificationSuccess={openNotificationSuccess}
          modalTitle={modalTitlePrepared}
          modalDescriptionText={modalDescriptionTextPrepared}
          inputLabel={inputLabelPrepared}
          endpoint={endpointPrepared}
          pathToValue={pathToValuePrepared}
          editModalWidth={editModalWidth}
          cols={cols}
          modalDescriptionTextStyle={modalDescriptionTextStyle}
          inputLabelStyle={inputLabelStyle}
        />
      </>
    )
  }

  const parsedText = parseAll({ text, replaceValues, multiQueryData })

  const parsedTextWithCounter = parsedText.replace('~counter~', String(counter || 0))

  return (
    <>
      <div style={containerStyle}>
        <Flex align="center" gap={8}>
          {parsedTextWithCounter}
          <Button
            type="text"
            size="small"
            onClick={e => {
              e.stopPropagation()
              setOpen(true)
            }}
            icon={<EditIcon />}
          />
        </Flex>
        {children}
      </div>
      {contextHolder}
      <EditModal
        open={open}
        close={() => setOpen(false)}
        values={tolerations}
        openNotificationSuccess={openNotificationSuccess}
        modalTitle={modalTitlePrepared}
        modalDescriptionText={modalDescriptionTextPrepared}
        inputLabel={inputLabelPrepared}
        endpoint={endpointPrepared}
        pathToValue={pathToValuePrepared}
        editModalWidth={editModalWidth}
        cols={cols}
        modalDescriptionTextStyle={modalDescriptionTextStyle}
        inputLabelStyle={inputLabelStyle}
      />
    </>
  )
}
