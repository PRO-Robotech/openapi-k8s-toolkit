/* eslint-disable max-lines-per-function */
/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC, useEffect, useRef } from 'react'
import jp from 'jsonpath'
import { Flex, Typography, Tooltip, Select, Form, Button } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import _ from 'lodash'
import { TFormName, TPersistedControls, TUrlParams } from 'localTypes/form'
import { TListInputCustomProps } from 'localTypes/formExtensions'
import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { getStringByName } from 'utils/getStringByName'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { prepareTemplate } from 'utils/prepareTemplate'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { PersistedCheckbox, HiddenContainer, ResetedFormItem, CustomSizeTitle, HeightContainer } from '../../atoms'
import {
  useDesignNewLayout,
  useOnValuesChangeCallback,
  useIsTouchedPersisted,
  useUpdateIsTouchedPersisted,
} from '../../organisms/BlackholeForm/context'
import { resolveFormPath, normalizeNameToPath, listItemBasePath } from './utils'
import { getRequiredRule } from '../helpers/validation'

type TFormListInputProps = {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  persistedControls: TPersistedControls
  customProps: TListInputCustomProps
  urlParams: TUrlParams
  onRemoveByMinus?: () => void
}

export const FormListInput: FC<TFormListInputProps> = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  isAdditionalProperties,
  removeField,
  persistedControls,
  customProps,
  urlParams,
  onRemoveByMinus,
}) => {
  const designNewLayout = useDesignNewLayout()
  const onValuesChangeCallBack = useOnValuesChangeCallback()
  const isTouchedPeristed = useIsTouchedPersisted()
  const updateTouched = useUpdateIsTouchedPersisted()

  const { cluster, namespace, syntheticProject, name: entryName } = urlParams
  const form = Form.useFormInstance()
  const fieldValue = Form.useWatch(name === 'nodeName' ? 'nodeNameBecauseOfSuddenBug' : name, form)

  const fixedName = name === 'nodeName' ? 'nodeNameBecauseOfSuddenBug' : name

  // Build absolute path of this field from the full 'fixedName'
  const fullFieldPath = normalizeNameToPath(fixedName)

  // Base for relative paths = the list item object (e.g. ["spec","hosts",0])
  const baseForRelative = listItemBasePath(fullFieldPath)

  // Resolve the (string) related path against that base
  const relatedPath = customProps.relatedValuePath
    ? resolveFormPath(customProps.relatedValuePath, baseForRelative)
    : undefined

  const rawRelatedFieldValue = Form.useWatch(relatedPath, form)
  const relatedFieldValue = relatedPath ? rawRelatedFieldValue : undefined
  const relatedTouched = relatedPath ? form.isFieldTouched(relatedPath) : '~'
  const isWaitingForRelatedValue = Boolean(relatedPath && !rawRelatedFieldValue)
  const relatedPathLabel = relatedPath?.join('.')
  const relatedValueTooltip = relatedPathLabel
    ? isWaitingForRelatedValue
      ? `Please select ${relatedPathLabel} first`
      : `Depends on ${relatedPathLabel}`
    : undefined

  // to prevent circular callback onvaluechange call
  const hasFiredRef = useRef(false)
  // remembering previous field value
  const relatedFieldValuePrev = useRef('unset')
  // remembering that we setted previous once, when user touched the field
  const hasSeededRef = useRef(false)

  // managing context of touched/untouched of related field
  useEffect(() => {
    if (relatedPath && relatedTouched) {
      updateTouched(prev => ({
        ...prev,
        [relatedPath.join('.') || 'your doing it wrong']: true,
      }))
    }
  }, [relatedPath, relatedTouched, updateTouched])

  // updating prev value on first user touch of related field
  useEffect(() => {
    if (relatedPath && isTouchedPeristed[relatedPath.join('.')] && relatedFieldValue && !hasSeededRef.current) {
      relatedFieldValuePrev.current = relatedFieldValue
      hasSeededRef.current = true
      form.setFieldValue(arrName || fixedName, undefined)
      onValuesChangeCallBack?.()
    }
  }, [
    relatedPath,
    relatedTouched,
    isTouchedPeristed,
    relatedFieldValue,
    form,
    arrName,
    fixedName,
    onValuesChangeCallBack,
  ])

  useEffect(() => {
    // only if previous value is touched
    if (!relatedPath || relatedFieldValuePrev.current === 'unset') {
      return
    }

    // if cleared or differs from previous value and not fired once
    if (
      (!relatedFieldValue ||
        (relatedFieldValuePrev.current !== 'unset' && relatedFieldValuePrev.current !== relatedFieldValue)) &&
      !hasFiredRef.current
    ) {
      form.setFieldValue(arrName || fixedName, undefined)
      onValuesChangeCallBack?.()

      // updating fired info
      hasFiredRef.current = true
      // updating previous value
      relatedFieldValuePrev.current = relatedFieldValue
    } else if (relatedFieldValue && hasFiredRef.current) {
      // user has set it back → re‑arm for the next clear
      hasFiredRef.current = false
    }
  }, [relatedPath, form, arrName, fixedName, relatedFieldValue, onValuesChangeCallBack, isTouchedPeristed])

  const uri = prepareTemplate({
    template: customProps.valueUri,
    replaceValues: { cluster, namespace, syntheticProject, relatedFieldValue, name: entryName },
  })

  const {
    data: optionsObj,
    isError: isErrorOptionsObj,
    isLoading: isLoadingOptionsObj,
  } = useDirectUnknownResource({
    uri,
    refetchInterval: false,
    queryKey: [uri || '', JSON.stringify(name)],
    isEnabled: !!uri && (!relatedPath || (relatedPath && !!relatedFieldValue)),
  })

  if (isLoadingOptionsObj && (!customProps.relatedValuePath || (customProps.relatedValuePath && !!relatedFieldValue))) {
    return <HeightContainer $height={64}>Loading</HeightContainer>
  }

  if (isErrorOptionsObj && (!customProps.relatedValuePath || (customProps.relatedValuePath && !!relatedFieldValue))) {
    return <HeightContainer $height={64}>Error</HeightContainer>
  }

  const items = !isErrorOptionsObj && !isLoadingOptionsObj && optionsObj ? _.get(optionsObj || {}, ['items']) : []
  const filteredItems = customProps.criteria
    ? items.filter((item: object) => {
        const objValue = Array.isArray(customProps.criteria?.keysToValue)
          ? _.get(item || {}, customProps.criteria?.keysToValue || [])
          : jp.query(item || {}, `$${customProps.criteria?.keysToValue}`)[0]
        if (customProps.criteria?.type === 'equals') {
          return objValue === customProps.criteria?.value
        }
        return objValue !== customProps.criteria?.value
      })
    : items
  const itemForPrefilledValue =
    customProps.criteria?.keepPrefilled !== false
      ? items.find((item: object) => {
          if (Array.isArray(customProps.keysToValue)) {
            return _.get(item || {}, customProps.keysToValue) === fieldValue
          }
          return jp.query(item || {}, `$${customProps.keysToValue}`)[0] === fieldValue
        })
      : undefined
  const filteredItemsAndPrefilledValue = itemForPrefilledValue
    ? [itemForPrefilledValue, ...filteredItems]
    : filteredItems
  const options = Array.isArray(filteredItemsAndPrefilledValue)
    ? filteredItemsAndPrefilledValue
        .map((item: object) => {
          const value = Array.isArray(customProps.keysToValue)
            ? _.get(item || {}, customProps.keysToValue)
            : jp.query(item || {}, `$${customProps.keysToValue}`)[0]
          let label: string = ''
          if (customProps.keysToLabel) {
            label = Array.isArray(customProps.keysToLabel)
              ? _.get(item || {}, customProps.keysToLabel)
              : jp.query(item || {}, `$${customProps.keysToLabel}`)[0]
          } else {
            label = Array.isArray(customProps.keysToValue)
              ? _.get(item || {}, customProps.keysToValue)
              : jp.query(item || {}, `$${customProps.keysToValue}`)[0]
          }
          return {
            value,
            label,
          }
        })
        .map(({ value, label }: { value: unknown; label: unknown }) => ({
          label: typeof label === 'string' ? label : JSON.stringify(label),
          value: typeof value === 'string' ? value : JSON.stringify(value),
        }))
    : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueOptions = options.reduce<{ value: any; label: any }[]>((acc, current) => {
    const exists = acc.some(item => item.value === current.value)
    if (!exists) {
      acc.push(current)
    }
    return acc
  }, [])

  const title = (
    <>
      {getStringByName(name)}
      {required?.includes(getStringByName(name)) && <Typography.Text type="danger">*</Typography.Text>}
    </>
  )

  return (
    <HiddenContainer name={name}>
      <Flex justify="space-between">
        <CustomSizeTitle $designNewLayout={designNewLayout}>
          {description ? <Tooltip title={description}>{title}</Tooltip> : title}
        </CustomSizeTitle>
        <Flex gap={4}>
          {isAdditionalProperties && (
            <Button size="small" type="text" onClick={() => removeField({ path: name })}>
              <MinusIcon />
            </Button>
          )}
          {onRemoveByMinus && (
            <Button size="small" type="text" onClick={onRemoveByMinus}>
              <MinusIcon />
            </Button>
          )}
          <PersistedCheckbox formName={persistName || name} persistedControls={persistedControls} type="arr" />
        </Flex>
      </Flex>
      <ResetedFormItem
        key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
        name={arrName || fixedName}
        rules={[getRequiredRule(forceNonRequired === false && !!required?.includes(getStringByName(name)), name)]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
      >
        <Flex gap={8} align="center">
          <Select
            mode={customProps.mode}
            placeholder="Select"
            options={uniqueOptions}
            filterOption={filterSelectOptions}
            disabled={isWaitingForRelatedValue}
            allowClear
            showSearch
            style={{ width: '100%' }}
          />
          {relatedValueTooltip && (
            <Tooltip title={relatedValueTooltip}>
              <QuestionCircleOutlined />
            </Tooltip>
          )}
        </Flex>
      </ResetedFormItem>
    </HiddenContainer>
  )
}
