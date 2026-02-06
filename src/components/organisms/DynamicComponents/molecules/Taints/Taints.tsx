/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React, { FC, useState } from 'react'
import jp from 'jsonpath'
import { notification, Flex, Button } from 'antd'
import { EditIcon } from 'components/atoms'
import { usePermissions } from 'hooks/usePermissions'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { TaintsEditModal } from '../../atoms'
import { getTaintsItemsInside } from '../../utils/Taints'

export const Taints: FC<{ data: TDynamicComponentsAppTypeMap['Taints']; children?: any }> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToArray,
    text,
    errorText,
    style,
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
    permissions,
    permissionContext,
  } = data

  const [api, contextHolder] = notification.useNotification()
  const [open, setOpen] = useState<boolean>(false)

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const safeMultiQueryData = multiQueryData || {}

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const permissionContextPrepared = permissionContext
    ? {
        cluster: parseAll({ text: permissionContext.cluster, replaceValues, multiQueryData: safeMultiQueryData }),
        namespace: permissionContext.namespace
          ? parseAll({ text: permissionContext.namespace, replaceValues, multiQueryData: safeMultiQueryData })
          : undefined,
        apiGroup: permissionContext.apiGroup
          ? parseAll({ text: permissionContext.apiGroup, replaceValues, multiQueryData: safeMultiQueryData })
          : undefined,
        plural: parseAll({ text: permissionContext.plural, replaceValues, multiQueryData: safeMultiQueryData }),
      }
    : undefined

  const isPermissionContextValid =
    !!permissionContextPrepared &&
    !isMultiQueryLoading &&
    !!permissionContextPrepared.cluster &&
    permissionContextPrepared.cluster !== '-' &&
    !!permissionContextPrepared.plural &&
    permissionContextPrepared.plural !== '-'

  const patchPermission = usePermissions({
    cluster: permissionContextPrepared?.cluster || '',
    namespace: permissionContextPrepared?.namespace,
    apiGroup: permissionContextPrepared?.apiGroup,
    plural: permissionContextPrepared?.plural || '',
    verb: 'patch',
    refetchInterval: false,
    enabler: isPermissionContextValid,
  })

  // Permission gating for patch-based edit:
  // 1) canPatch: Manual permissions override hook result if provided.
  // 2) shouldGateEdit: True when permissions or permissionContext are provided; otherwise don't gate.
  // 3) canSubmitEdit: Allow save when gating is off or canPatch === true.
  const canPatch = permissions?.canPatch ?? patchPermission.data?.status.allowed
  const shouldGateEdit = Boolean(permissions || permissionContext)
  const canOpenEdit = true
  const canSubmitEdit = !shouldGateEdit || canPatch === true

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

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    console.log(`Item Counter: ${id}: No root for json path`)
    return <span style={style}>{errorText}</span>
  }

  const anythingForNow = jp.query(jsonRoot || {}, `$${jsonPathToArray}`)

  const { counter, taints, error: errorArrayOfObjects } = getTaintsItemsInside(anythingForNow)

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
            {errorText}{' '}
            {canOpenEdit && (
              <Button
                type="text"
                size="small"
                onClick={e => {
                  e.stopPropagation()
                  setOpen(true)
                }}
                icon={<EditIcon />}
              />
            )}
          </Flex>
        </div>
        {contextHolder}
        {canOpenEdit && (
          <TaintsEditModal
            open={open}
            close={() => setOpen(false)}
            values={taints}
            openNotificationSuccess={openNotificationSuccess}
            disableSubmit={!canSubmitEdit}
            modalTitle={modalTitlePrepared}
            modalDescriptionText={modalDescriptionTextPrepared}
            modalDescriptionTextStyle={modalDescriptionTextStyle}
            inputLabel={inputLabelPrepared}
            inputLabelStyle={inputLabelStyle}
            endpoint={endpointPrepared}
            pathToValue={pathToValuePrepared}
            editModalWidth={editModalWidth}
            cols={cols}
          />
        )}
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
          {canOpenEdit && (
            <Button
              type="text"
              size="small"
              onClick={e => {
                e.stopPropagation()
                setOpen(true)
              }}
              icon={<EditIcon />}
            />
          )}
        </Flex>
        {children}
      </div>
      {contextHolder}
      {canOpenEdit && (
        <TaintsEditModal
          open={open}
          close={() => setOpen(false)}
          values={taints}
          openNotificationSuccess={openNotificationSuccess}
          disableSubmit={!canSubmitEdit}
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
      )}
    </>
  )
}
