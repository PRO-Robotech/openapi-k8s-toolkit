/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React, { FC, useState } from 'react'
import jp from 'jsonpath'
import { notification } from 'antd'
import { useMultiQuery } from '../../../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../../../utils'
import { TaintsEditModal } from '../../../../atoms'
import { getTaintsItemsInside } from '../../../../utils/Taints'
import type { TTaintsBaseProps, TTaintsModalProps } from '../../../../types/Taints'

export const Taints: FC<TTaintsBaseProps & TTaintsModalProps> = ({
  reqIndex,
  jsonPathToArray,
  notificationSuccessMessage,
  notificationSuccessMessageDescription,
  modalTitle,
  modalDescriptionText,
  modalDescriptionTextStyle,
  inputLabel,
  inputLabelStyle,
  endpoint,
  pathToValue,
  editModalWidth,
  cols,
}) => {
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
    console.log(`Item Counter: No root for json path`)
  }

  const anythingForNow = jp.query(jsonRoot || {}, `$${jsonPathToArray}`)

  const { taints, error: errorArrayOfObjects } = getTaintsItemsInside(anythingForNow)

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
    console.log(`Item Counter:  ${errorArrayOfObjects}`)
    return (
      <>
        {contextHolder}
        <TaintsEditModal
          open={open}
          close={() => setOpen(false)}
          values={taints}
          openNotificationSuccess={openNotificationSuccess}
          modalTitle={modalTitlePrepared}
          modalDescriptionText={errorArrayOfObjects}
          modalDescriptionTextStyle={modalDescriptionTextStyle}
          inputLabel={inputLabelPrepared}
          inputLabelStyle={inputLabelStyle}
          endpoint={endpointPrepared}
          pathToValue={pathToValuePrepared}
          editModalWidth={editModalWidth}
          cols={cols}
        />
      </>
    )
  }

  return (
    <>
      {contextHolder}
      <TaintsEditModal
        open={open}
        close={() => setOpen(false)}
        values={taints}
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
