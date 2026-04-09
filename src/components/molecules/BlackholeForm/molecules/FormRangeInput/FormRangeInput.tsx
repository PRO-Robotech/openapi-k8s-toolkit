/* eslint-disable max-lines-per-function */
import React, { FC } from 'react'
import { TFormName, TPersistedControls, TUrlParams } from 'localTypes/form'
import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { TRangeInputCustomProps } from 'localTypes/formExtensions'
import { prepareTemplate } from 'utils/prepareTemplate'
import { prepareMinAndMaxValues } from './utils'
import { RangeInput } from './molecules'

type TFormRangeInputProps = {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  isEdit?: boolean
  persistedControls: TPersistedControls
  customProps: TRangeInputCustomProps
  urlParams: TUrlParams
  onRemoveByMinus?: () => void
}

export const FormRangeInput: FC<TFormRangeInputProps> = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  isEdit,
  persistedControls,
  customProps,
  urlParams,
  onRemoveByMinus,
}) => {
  const { cluster, namespace, syntheticProject, name: entryName } = urlParams

  const minMaxAndStep = isEdit ? customProps.edit : customProps.add

  const minValueUri =
    minMaxAndStep.min.type === 'resourceValue'
      ? prepareTemplate({
          template: minMaxAndStep.min.valueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const minSubstractFirstValueUri =
    minMaxAndStep.min.type === 'substractResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.min.firstValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const minSubstractSecondValueUri =
    minMaxAndStep.min.type === 'substractResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.min.secondValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const minAddFirstValueUri =
    minMaxAndStep.min.type === 'addResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.min.firstValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const minAddSecondValueUri =
    minMaxAndStep.min.type === 'addResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.min.secondValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined

  const maxValueUri =
    minMaxAndStep.max.type === 'resourceValue'
      ? prepareTemplate({
          template: minMaxAndStep.max.valueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const maxSubstractFirstValueUri =
    minMaxAndStep.max.type === 'substractResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.max.firstValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const maxSubstractSecondValueUri =
    minMaxAndStep.max.type === 'substractResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.max.secondValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const maxAddFirstValueUri =
    minMaxAndStep.max.type === 'addResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.max.firstValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined
  const maxAddSecondValueUri =
    minMaxAndStep.max.type === 'addResourceValues'
      ? prepareTemplate({
          template: minMaxAndStep.max.secondValueUri,
          replaceValues: { cluster, namespace, syntheticProject, name: entryName },
        })
      : undefined

  const {
    data: minValueObj,
    isError: isErrorMinValueObj,
    isLoading: isLoadingMinValueObj,
  } = useDirectUnknownResource({
    uri: minValueUri || '',
    refetchInterval: false,
    queryKey: [minValueUri || '', JSON.stringify(name)],
    isEnabled: !!minValueUri,
  })
  const {
    data: minSubstractFirstValueObj,
    isError: isErrorMinSubstractFirstValueObj,
    isLoading: isLoadingMinSubstractFirstValueObj,
  } = useDirectUnknownResource({
    uri: minSubstractFirstValueUri || '',
    refetchInterval: false,
    queryKey: [minSubstractFirstValueUri || '', JSON.stringify(name)],
    isEnabled: !!minSubstractFirstValueUri,
  })
  const {
    data: minSubstractSecondValueObj,
    isError: isErrorMinSubstractSecondValueObj,
    isLoading: isLoadingMinSubstractSecondValueObj,
  } = useDirectUnknownResource({
    uri: minSubstractSecondValueUri || '',
    refetchInterval: false,
    queryKey: [minSubstractSecondValueUri || '', JSON.stringify(name)],
    isEnabled: !!minSubstractSecondValueUri,
  })
  const {
    data: minAddFirstValueObj,
    isError: isErrorMinAddFirstValueObj,
    isLoading: isLoadingMinAddFirstValueObj,
  } = useDirectUnknownResource({
    uri: minAddFirstValueUri || '',
    refetchInterval: false,
    queryKey: [minAddFirstValueUri || '', JSON.stringify(name)],
    isEnabled: !!minAddFirstValueUri,
  })
  const {
    data: minAddSecondValueObj,
    isError: isErrorMinAddSecondValueObj,
    isLoading: isLoadingMinAddSecondValueObj,
  } = useDirectUnknownResource({
    uri: minAddSecondValueUri || '',
    refetchInterval: false,
    queryKey: [minAddSecondValueUri || '', JSON.stringify(name)],
    isEnabled: !!minAddSecondValueUri,
  })
  const {
    data: maxValueObj,
    isError: isErrorMaxValueObj,
    isLoading: isLoadingMaxValueObj,
  } = useDirectUnknownResource({
    uri: maxValueUri || '',
    refetchInterval: false,
    queryKey: [maxValueUri || '', JSON.stringify(name)],
    isEnabled: !!maxValueUri,
  })
  const {
    data: maxSubstractFirstValueObj,
    isError: isErrorMaxSubstractFirstValueObj,
    isLoading: isLoadingMaxSubstractFirstValueObj,
  } = useDirectUnknownResource({
    uri: maxSubstractFirstValueUri || '',
    refetchInterval: false,
    queryKey: [maxSubstractFirstValueUri || '', JSON.stringify(name)],
    isEnabled: !!maxSubstractFirstValueUri,
  })
  const {
    data: maxSubstractSecondValueObj,
    isError: isErrorMaxSubstractSecondValueObj,
    isLoading: isLoadingMaxSubstractSecondValueObj,
  } = useDirectUnknownResource({
    uri: maxSubstractSecondValueUri || '',
    refetchInterval: false,
    queryKey: [maxSubstractSecondValueUri || '', JSON.stringify(name)],
    isEnabled: !!maxSubstractSecondValueUri,
  })
  const {
    data: maxAddFirstValueObj,
    isError: isErrorMaxAddFirstValueObj,
    isLoading: isLoadingMaxAddFirstValueObj,
  } = useDirectUnknownResource({
    uri: maxAddFirstValueUri || '',
    refetchInterval: false,
    queryKey: [maxAddFirstValueUri || '', JSON.stringify(name)],
    isEnabled: !!maxAddFirstValueUri,
  })
  const {
    data: maxAddSecondValueObj,
    isError: isErrorMaxAddSecondValueObj,
    isLoading: isLoadingMaxAddSecondValueObj,
  } = useDirectUnknownResource({
    uri: maxAddSecondValueUri || '',
    refetchInterval: false,
    queryKey: [maxAddSecondValueUri || '', JSON.stringify(name)],
    isEnabled: !!maxAddSecondValueUri,
  })

  const { minValue, maxValue } = prepareMinAndMaxValues({
    minMaxAndStep,
    minValueObj,
    minSubstractFirstValueObj,
    minSubstractSecondValueObj,
    minAddFirstValueObj,
    minAddSecondValueObj,
    maxValueObj,
    maxSubstractFirstValueObj,
    maxSubstractSecondValueObj,
    maxAddFirstValueObj,
    maxAddSecondValueObj,
    logic: customProps.logic,
  })

  const step = isEdit ? customProps.edit.step : customProps.add.step

  if (
    (minMaxAndStep.min.type === 'resourceValue' && isLoadingMinValueObj) ||
    (minMaxAndStep.min.type === 'substractResourceValues' &&
      (isLoadingMinSubstractFirstValueObj || isLoadingMinSubstractSecondValueObj)) ||
    (minMaxAndStep.min.type === 'addResourceValues' &&
      (isLoadingMinAddFirstValueObj || isLoadingMinAddSecondValueObj)) ||
    (minMaxAndStep.max.type === 'resourceValue' && isLoadingMaxValueObj) ||
    (minMaxAndStep.max.type === 'substractResourceValues' &&
      (isLoadingMaxSubstractFirstValueObj || isLoadingMaxSubstractSecondValueObj)) ||
    (minMaxAndStep.max.type === 'addResourceValues' && (isLoadingMaxAddFirstValueObj || isLoadingMaxAddSecondValueObj))
  ) {
    return <div>Loading</div>
  }

  if (
    (minMaxAndStep.min.type === 'resourceValue' && isErrorMinValueObj) ||
    (minMaxAndStep.min.type === 'substractResourceValues' &&
      (isErrorMinSubstractFirstValueObj || isErrorMinSubstractSecondValueObj)) ||
    (minMaxAndStep.min.type === 'addResourceValues' && (isErrorMinAddFirstValueObj || isErrorMinAddSecondValueObj)) ||
    (minMaxAndStep.max.type === 'resourceValue' && isErrorMaxValueObj) ||
    (minMaxAndStep.max.type === 'substractResourceValues' &&
      (isErrorMaxSubstractFirstValueObj || isErrorMaxSubstractSecondValueObj)) ||
    (minMaxAndStep.max.type === 'addResourceValues' && (isErrorMaxAddFirstValueObj || isErrorMaxAddSecondValueObj))
  ) {
    return <div>Error</div>
  }

  return (
    <RangeInput
      name={name}
      arrKey={arrKey}
      arrName={arrName}
      persistName={persistName}
      required={required}
      forceNonRequired={forceNonRequired}
      description={description}
      min={minValue}
      max={maxValue}
      step={step}
      persistedControls={persistedControls}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}
