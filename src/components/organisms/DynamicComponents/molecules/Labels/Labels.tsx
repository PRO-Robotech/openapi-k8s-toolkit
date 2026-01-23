/* eslint-disable max-lines-per-function */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC, useState } from 'react'
import jp from 'jsonpath'
import { useNavigate } from 'react-router-dom'
import { Popover, notification, Flex, Button } from 'antd'
import { UncontrolledSelect, CursorPointerTag, CursorPointerTagMinContent, EditIcon, Spacer } from 'components/atoms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { LabelsEditModal } from '../../atoms'
import { parseArrayOfAny, truncate } from './utils'

export const Labels: FC<{ data: TDynamicComponentsAppTypeMap['Labels']; children?: any }> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToLabels,
    linkPrefix,
    selectProps,
    maxTagKeyLength,
    maxTagValueLength,
    verticalViewList,
    verticalViewListFlexProps,
    emptyListMessage,
    emptyListMessageStyle,
    readOnly,
    notificationSuccessMessage,
    notificationSuccessMessageDescription,
    modalTitle,
    modalDescriptionText,
    modalDescriptionTextStyle,
    inputLabel,
    inputLabelStyle,
    containerStyle,
    maxEditTagTextLength,
    allowClearEditSelect,
    endpoint,
    pathToValue,
    editModalWidth,
    paddingContainerEnd,
  } = data

  const [api, contextHolder] = notification.useNotification()
  const navigate = useNavigate()
  const [open, setOpen] = useState<boolean>(false)

  const { maxTagTextLength, ...restSelectProps } = selectProps || { maxTagTextLength: undefined }

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

  const { data: labelsRaw, error: errorArrayOfObjects } = parseArrayOfAny(anythingForNow)

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
  const linkPrefixPrepared = linkPrefix ? parseAll({ text: linkPrefix, replaceValues, multiQueryData }) : undefined

  const openNotificationSuccess = () => {
    api.success({
      message: notificationSuccessMessagePrepared,
      description: notificationSuccessMessageDescriptionPrepared,
      placement: 'bottomRight',
    })
  }

  const EmptySelect = (
    <div style={containerStyle}>
      {!readOnly && !verticalViewList && (
        <Flex justify="flex-end">
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
      )}
      {verticalViewList ? (
        <div style={emptyListMessageStyle}>{emptyListMessage}</div>
      ) : (
        <UncontrolledSelect
          mode="multiple"
          {...restSelectProps}
          value={[]}
          options={[]}
          open={false}
          showSearch={false}
          removeIcon={() => {
            return null
          }}
          suffixIcon={null}
          isCursorPointer
        />
      )}
      {!readOnly && verticalViewList && (
        <>
          <Spacer $space={8} $samespace />
          <Flex justify="flex-start">
            <Button
              type="text"
              size="small"
              onClick={e => {
                e.stopPropagation()
                setOpen(true)
              }}
              icon={<EditIcon />}
              iconPosition="end"
            >
              Edit
            </Button>
          </Flex>
        </>
      )}
      {children}
      {contextHolder}
      <LabelsEditModal
        open={open}
        close={() => setOpen(false)}
        // values={labelsRaw}
        openNotificationSuccess={openNotificationSuccess}
        modalTitle={modalTitlePrepared}
        modalDescriptionText={modalDescriptionTextPrepared}
        inputLabel={inputLabelPrepared}
        maxEditTagTextLength={maxEditTagTextLength}
        allowClearEditSelect={allowClearEditSelect}
        endpoint={endpointPrepared}
        pathToValue={pathToValuePrepared}
        editModalWidth={editModalWidth}
        paddingContainerEnd={paddingContainerEnd}
        modalDescriptionTextStyle={modalDescriptionTextStyle}
        inputLabelStyle={inputLabelStyle}
      />
    </div>
  )

  if (!labelsRaw) {
    if (errorArrayOfObjects) {
      // return <div>{errorArrayOfObjects}</div>
      return EmptySelect
    }
    // return <div>Not a valid data structure</div>
    return EmptySelect
  }

  const labels = Object.entries(labelsRaw).map(([key, value]) => `${key}=${value}`)

  return (
    <div style={containerStyle}>
      {!readOnly && !verticalViewList && (
        <Flex justify="flex-end">
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
      )}
      {verticalViewList ? (
        <Flex vertical gap={8} {...verticalViewListFlexProps}>
          {labels.map(label => {
            let labelToRender: string = 'Not a string value'
            if (typeof label === 'string') {
              if (maxTagKeyLength || maxTagValueLength) {
                const splittedLabel = label.split('=')
                if (splittedLabel[0] && splittedLabel[0].length > 0) {
                  labelToRender = maxTagKeyLength ? truncate(splittedLabel[0], maxTagKeyLength) : splittedLabel[0]
                }
                labelToRender += '='
                if (splittedLabel[1] && splittedLabel[1].length > 0) {
                  labelToRender += maxTagValueLength ? truncate(splittedLabel[1], maxTagValueLength) : splittedLabel[1]
                }
              } else {
                labelToRender = truncate(label, maxTagTextLength)
              }
            }
            return (
              <Popover content={label} key={label}>
                <CursorPointerTagMinContent
                  onClick={e => {
                    if (typeof label === 'string' && linkPrefix) {
                      navigate(`${linkPrefixPrepared}${encodeURIComponent(label)}`)
                    }
                    e.stopPropagation()
                  }}
                >
                  {labelToRender}
                </CursorPointerTagMinContent>
              </Popover>
            )
          })}
        </Flex>
      ) : (
        <UncontrolledSelect
          mode="multiple"
          // maxTagCount="responsive"
          {...restSelectProps}
          value={labels.map(el => ({ label: el, value: el }))}
          options={labels.map(el => ({ label: el, value: el }))}
          open={false}
          showSearch={false}
          removeIcon={() => {
            return null
          }}
          suffixIcon={null}
          tagRender={({ label }) => {
            let labelToRender: string = 'Not a string value'
            if (typeof label === 'string') {
              if (maxTagKeyLength || maxTagValueLength) {
                const splittedLabel = label.split('=')
                if (splittedLabel[0] && splittedLabel[0].length > 0) {
                  labelToRender = maxTagKeyLength ? truncate(splittedLabel[0], maxTagKeyLength) : splittedLabel[0]
                }
                labelToRender += '='
                if (splittedLabel[1] && splittedLabel[1].length > 0) {
                  labelToRender += maxTagValueLength ? truncate(splittedLabel[1], maxTagValueLength) : splittedLabel[1]
                }
              } else {
                labelToRender = truncate(label, maxTagTextLength)
              }
            }
            return (
              <Popover content={label}>
                <CursorPointerTag
                  onClick={e => {
                    if (typeof label === 'string' && linkPrefix) {
                      navigate(`${linkPrefixPrepared}${encodeURIComponent(label)}`)
                    }
                    e.stopPropagation()
                  }}
                >
                  {labelToRender}
                </CursorPointerTag>
              </Popover>
            )
          }}
          // isCursorPointer
        />
      )}
      {!readOnly && verticalViewList && (
        <>
          <Spacer $space={8} $samespace />
          <Flex justify="flex-start">
            <Button
              type="text"
              size="small"
              onClick={e => {
                e.stopPropagation()
                setOpen(true)
              }}
              icon={<EditIcon />}
              iconPosition="end"
            >
              Edit
            </Button>
          </Flex>
        </>
      )}
      {children}
      {contextHolder}
      <LabelsEditModal
        open={open}
        close={() => setOpen(false)}
        values={labelsRaw}
        openNotificationSuccess={openNotificationSuccess}
        modalTitle={modalTitlePrepared}
        modalDescriptionText={modalDescriptionTextPrepared}
        inputLabel={inputLabelPrepared}
        maxEditTagTextLength={maxEditTagTextLength}
        allowClearEditSelect={allowClearEditSelect}
        endpoint={endpointPrepared}
        pathToValue={pathToValuePrepared}
        editModalWidth={editModalWidth}
        paddingContainerEnd={paddingContainerEnd}
        modalDescriptionTextStyle={modalDescriptionTextStyle}
        inputLabelStyle={inputLabelStyle}
      />
    </div>
  )
}
