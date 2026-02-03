/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React, { FC, useEffect, useState } from 'react'
import jp from 'jsonpath'
import { theme as antdtheme, Flex } from 'antd'
import { usePermissions } from 'hooks/usePermissions'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { getItemCounterItemsInside } from '../../utils/ItemCounter'
import { getKeyCounterItemsInside } from '../../utils/KeyCounter'
import { parseAll } from '../utils'
import { renderActiveType, renderIcon } from './utils'
import { Styled } from './styled'

const isPatchActiveType = (
  value: TDynamicComponentsAppTypeMap['AggregatedCounterCard']['activeType'],
): value is Extract<
  NonNullable<TDynamicComponentsAppTypeMap['AggregatedCounterCard']['activeType']>,
  { type: 'labels' | 'annotations' | 'taints' | 'tolerations' }
> =>
  value?.type === 'labels' || value?.type === 'annotations' || value?.type === 'taints' || value?.type === 'tolerations'

export const AggregatedCounterCard: FC<{
  data: TDynamicComponentsAppTypeMap['AggregatedCounterCard']
  children?: any
}> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    text,
    iconBase64Encoded,
    counter,
    activeType,
  } = data
  const { token } = antdtheme.useToken()
  const [open, setOpen] = useState<boolean>(false)

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const safeMultiQueryData = multiQueryData || {}

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const patchActiveType = isPatchActiveType(activeType) ? activeType : undefined

  const permissionContextPrepared = patchActiveType?.props.permissionContext
    ? {
        cluster: parseAll({
          text: patchActiveType.props.permissionContext.cluster,
          replaceValues,
          multiQueryData: safeMultiQueryData,
        }),
        namespace: patchActiveType.props.permissionContext.namespace
          ? parseAll({
              text: patchActiveType.props.permissionContext.namespace,
              replaceValues,
              multiQueryData: safeMultiQueryData,
            })
          : undefined,
        apiGroup: patchActiveType.props.permissionContext.apiGroup
          ? parseAll({
              text: patchActiveType.props.permissionContext.apiGroup,
              replaceValues,
              multiQueryData: safeMultiQueryData,
            })
          : undefined,
        plural: parseAll({
          text: patchActiveType.props.permissionContext.plural,
          replaceValues,
          multiQueryData: safeMultiQueryData,
        }),
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

  // Permission gating for patch-based modals:
  // 1) canPatch: If the active type (labels/annotations/taints/tolerations) provides a manual
  //    permissions?.canPatch, use that. Otherwise fall back to the usePermissions hook result.
  // 2) shouldGateEdit: True when permissions or permissionContext are provided; otherwise we don't gate.
  // 3) canOpenActiveType: The card can open its modal if there is an activeType and:
  //    - it is not a patch-gated type, or
  //    - gating is off (no permissions/context), or
  //    - gating is on and canPatch === true.
  const canPatch = patchActiveType?.props.permissions?.canPatch ?? patchPermission.data?.status.allowed
  const shouldGateEdit = Boolean(patchActiveType?.props.permissions || patchActiveType?.props.permissionContext)
  const canOpenActiveType = !!activeType && (!patchActiveType || !shouldGateEdit || canPatch === true)

  useEffect(() => {
    if (open && !canOpenActiveType) {
      setOpen(false)
    }
  }, [open, canOpenActiveType])

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

  const jsonRoot = multiQueryData[`req${counter.props.reqIndex}`]

  if (jsonRoot === undefined) {
    console.log(`Counter: ${id}: No root for json path`)
    return (
      <Styled.Card
        $colorBorder={token.colorBorder}
        $colorBgContainer={token.colorBgContainer}
        $colorPrimary={token.colorPrimary}
        $cursorPointer={canOpenActiveType}
        onClick={() => {
          if (canOpenActiveType) {
            setOpen(true)
          }
          return undefined
        }}
      >
        <Flex gap={4} vertical>
          <Styled.CardTitle
            $colorTextDescription={token.colorTextDescription}
          >{`Counter: ${id}: No root for json path`}</Styled.CardTitle>
          <Styled.CardNumber $colorText={token.colorText}>-</Styled.CardNumber>
        </Flex>
        <Styled.CardIcon $colorInfo={token.colorInfo}>
          {iconBase64Encoded && renderIcon(iconBase64Encoded, token.colorInfo)}
        </Styled.CardIcon>
      </Styled.Card>
    )
  }

  const path = counter.type === 'item' ? counter.props.jsonPathToArray : counter.props.jsonPathToObj
  const anythingForNow = jp.query(jsonRoot || {}, `$${path}`)

  const { counter: counterToDisplay, error: errorParsingCounter } =
    counter.type === 'item' ? getItemCounterItemsInside(anythingForNow) : getKeyCounterItemsInside(anythingForNow)

  if (errorParsingCounter) {
    console.log(`Counter: ${id}: ${errorParsingCounter}`)
    return (
      <Styled.Card
        $colorBorder={token.colorBorder}
        $colorBgContainer={token.colorBgContainer}
        $colorPrimary={token.colorPrimary}
        $cursorPointer={canOpenActiveType}
        onClick={() => {
          if (canOpenActiveType) {
            setOpen(true)
          }
          return undefined
        }}
      >
        <Flex gap={4} vertical>
          <Styled.CardTitle $colorTextDescription={token.colorTextDescription}>{errorParsingCounter}</Styled.CardTitle>
          <Styled.CardNumber $colorText={token.colorText}>-</Styled.CardNumber>
        </Flex>
        <Styled.CardIcon $colorInfo={token.colorInfo}>
          {iconBase64Encoded && renderIcon(iconBase64Encoded, token.colorInfo)}
        </Styled.CardIcon>
      </Styled.Card>
    )
  }

  const parsedText = parseAll({ text, replaceValues, multiQueryData })

  return (
    <div>
      <Styled.Card
        $colorBorder={token.colorBorder}
        $colorBgContainer={token.colorBgContainer}
        $colorPrimary={token.colorPrimary}
        $cursorPointer={canOpenActiveType}
        onClick={() => {
          if (canOpenActiveType) {
            setOpen(true)
          }
          return undefined
        }}
      >
        <Flex gap={4} vertical>
          <Styled.CardTitle $colorTextDescription={token.colorTextDescription}>{parsedText}</Styled.CardTitle>
          <Styled.CardNumber $colorText={token.colorText}>{counterToDisplay}</Styled.CardNumber>
        </Flex>
        <Styled.CardIcon $colorInfo={token.colorInfo}>
          {iconBase64Encoded && renderIcon(iconBase64Encoded, token.colorInfo)}
        </Styled.CardIcon>
      </Styled.Card>
      <Styled.HiddenContainer $isHidden={!open}>
        {canOpenActiveType && renderActiveType(activeType, { open, onClose: () => setOpen(false) })}
      </Styled.HiddenContainer>
      {children}
    </div>
  )
}
