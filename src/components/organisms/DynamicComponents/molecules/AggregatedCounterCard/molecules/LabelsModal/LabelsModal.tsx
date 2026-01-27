/* eslint-disable max-lines-per-function */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { notification } from 'antd'
import { useMultiQuery } from '../../../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../../../utils'
import { LabelsEditModal } from '../../../../atoms'
import { parseLabelsArrayOfAny } from '../../../../utils/Labels'
import type { TLabelsBaseProps, TLabelsModalProps as TModalInner } from '../../../../types/Labels'

type TLabelsModalProps = {
  open: boolean
  onClose: () => void
} & TLabelsBaseProps &
  TModalInner

export const LabelsModal: FC<TLabelsModalProps> = ({
  open,
  onClose,
  reqIndex,
  jsonPathToLabels,
  notificationSuccessMessage,
  notificationSuccessMessageDescription,
  modalTitle,
  modalDescriptionText,
  modalDescriptionTextStyle,
  inputLabel,
  inputLabelStyle,
  maxEditTagTextLength,
  allowClearEditSelect,
  endpoint,
  pathToValue,
  editModalWidth,
  paddingContainerEnd,
}) => {
  const [api, contextHolder] = notification.useNotification()

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

  const anythingForNow = jp.query(jsonRoot || {}, `$${jsonPathToLabels}`)

  const { data: labelsRaw, error: errorArrayOfObjects } = parseLabelsArrayOfAny(anythingForNow)

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

  const EmptySelect = (
    <>
      {contextHolder}
      <LabelsEditModal
        open={open}
        close={onClose}
        // values={labelsRaw}
        openNotificationSuccess={openNotificationSuccess}
        modalTitle={modalTitlePrepared}
        modalDescriptionText={modalDescriptionTextPrepared}
        modalDescriptionTextStyle={modalDescriptionTextStyle}
        inputLabel={inputLabelPrepared}
        inputLabelStyle={inputLabelStyle}
        maxEditTagTextLength={maxEditTagTextLength}
        allowClearEditSelect={allowClearEditSelect}
        endpoint={endpointPrepared}
        pathToValue={pathToValuePrepared}
        editModalWidth={editModalWidth}
        paddingContainerEnd={paddingContainerEnd}
      />
    </>
  )

  if (!labelsRaw) {
    if (errorArrayOfObjects) {
      // return <div>{errorArrayOfObjects}</div>
      return EmptySelect
    }
    // return <div>Not a valid data structure</div>
    return EmptySelect
  }

  return (
    <>
      {contextHolder}
      <LabelsEditModal
        open={open}
        close={onClose}
        values={labelsRaw}
        openNotificationSuccess={openNotificationSuccess}
        modalTitle={modalTitlePrepared}
        modalDescriptionText={modalDescriptionTextPrepared}
        modalDescriptionTextStyle={modalDescriptionTextStyle}
        inputLabel={inputLabelPrepared}
        inputLabelStyle={inputLabelStyle}
        maxEditTagTextLength={maxEditTagTextLength}
        allowClearEditSelect={allowClearEditSelect}
        endpoint={endpointPrepared}
        pathToValue={pathToValuePrepared}
        editModalWidth={editModalWidth}
        paddingContainerEnd={paddingContainerEnd}
      />
    </>
  )
}
