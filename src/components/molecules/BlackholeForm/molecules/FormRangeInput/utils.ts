import jp from 'jsonpath'
import _ from 'lodash'
import { TRangeInputCustomValuesBlock } from 'localTypes/formExtensions'
import { parseQuotaValueCpu, parseQuotaValueMemoryAndStorage } from 'utils/parseForQuotaValues'

const getValue = ({
  valueObj,
  keysToValue,
  logic,
}: {
  valueObj: object
  keysToValue: string | string[]
  logic: 'memoryLike' | 'cpuLike'
}): number => {
  const dirtyValue = Array.isArray(keysToValue)
    ? _.get(valueObj || {}, keysToValue)
    : jp.query(valueObj || {}, `$${keysToValue}`)[0]
  if (logic === 'cpuLike') {
    return parseQuotaValueCpu(dirtyValue)
  }
  return parseQuotaValueMemoryAndStorage(dirtyValue)
}

const prepareSimpleValue = ({ value }: { value: number }): number => {
  return Number(value.toFixed(1))
}

const prepareSubstractValues = ({ valueFirst, valueSecond }: { valueFirst: number; valueSecond: number }): number => {
  const dirtyResult = valueFirst - valueSecond
  return Number(dirtyResult.toFixed(1))
}

const prepareAddValues = ({ valueFirst, valueSecond }: { valueFirst: number; valueSecond: number }): number => {
  const dirtyResult = valueFirst + valueSecond
  return Number(dirtyResult.toFixed(1))
}

export const prepareMinAndMaxValues = ({
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
  logic,
}: {
  minMaxAndStep: TRangeInputCustomValuesBlock
  minValueObj: unknown
  minSubstractFirstValueObj: unknown
  minSubstractSecondValueObj: unknown
  minAddFirstValueObj: unknown
  minAddSecondValueObj: unknown
  maxValueObj: unknown
  maxSubstractFirstValueObj: unknown
  maxSubstractSecondValueObj: unknown
  maxAddFirstValueObj: unknown
  maxAddSecondValueObj: unknown
  logic: 'memoryLike' | 'cpuLike'
}): {
  minValue: number
  maxValue: number
} => {
  let minValue = 0
  let maxValue = 0
  if (minMaxAndStep.min.type === 'resourceValue' && typeof minValueObj === 'object' && minValueObj !== null) {
    const minValueUnprepared = getValue({
      valueObj: minValueObj,
      keysToValue: minMaxAndStep.min.keysToValue,
      logic,
    })
    minValue = prepareSimpleValue({ value: minValueUnprepared })
  }
  if (
    minMaxAndStep.min.type === 'substractResourceValues' &&
    typeof minSubstractFirstValueObj === 'object' &&
    minSubstractFirstValueObj !== null &&
    typeof minSubstractSecondValueObj === 'object' &&
    minSubstractSecondValueObj !== null
  ) {
    const minSubstractFirstValue = getValue({
      valueObj: minSubstractFirstValueObj,
      keysToValue: minMaxAndStep.min.firstValuesKeysToValue,
      logic,
    })
    const minSubstractSecondValue = getValue({
      valueObj: minSubstractSecondValueObj,
      keysToValue: minMaxAndStep.min.secondValuesKeysToValue,
      logic,
    })
    minValue = prepareSubstractValues({ valueFirst: minSubstractFirstValue, valueSecond: minSubstractSecondValue })
  }
  if (
    minMaxAndStep.min.type === 'addResourceValues' &&
    typeof minAddFirstValueObj === 'object' &&
    minAddFirstValueObj !== null &&
    typeof minAddSecondValueObj === 'object' &&
    minAddSecondValueObj !== null
  ) {
    const minAddFirstValue = getValue({
      valueObj: minAddFirstValueObj,
      keysToValue: minMaxAndStep.min.firstValuesKeysToValue,
      logic,
    })
    const minAddSecondValue = getValue({
      valueObj: minAddSecondValueObj,
      keysToValue: minMaxAndStep.min.secondValuesKeysToValue,
      logic,
    })
    minValue = prepareAddValues({ valueFirst: minAddFirstValue, valueSecond: minAddSecondValue })
  }
  if (minMaxAndStep.min.type === 'number') {
    minValue = minMaxAndStep.min.value
  }

  if (minMaxAndStep.max.type === 'resourceValue' && typeof maxValueObj === 'object' && maxValueObj !== null) {
    const maxValueUnprepared = getValue({
      valueObj: maxValueObj,
      keysToValue: minMaxAndStep.max.keysToValue,
      logic,
    })
    maxValue = prepareSimpleValue({ value: maxValueUnprepared })
  }
  if (
    minMaxAndStep.max.type === 'substractResourceValues' &&
    typeof maxSubstractFirstValueObj === 'object' &&
    maxSubstractFirstValueObj !== null &&
    typeof maxSubstractSecondValueObj === 'object' &&
    maxSubstractSecondValueObj !== null
  ) {
    const maxSubstractFirstValue = getValue({
      valueObj: maxSubstractFirstValueObj,
      keysToValue: minMaxAndStep.max.firstValuesKeysToValue,
      logic,
    })
    const maxSubstractSecondValue = getValue({
      valueObj: maxSubstractSecondValueObj,
      keysToValue: minMaxAndStep.max.secondValuesKeysToValue,
      logic,
    })
    maxValue = prepareSubstractValues({ valueFirst: maxSubstractFirstValue, valueSecond: maxSubstractSecondValue })
  }
  if (
    minMaxAndStep.max.type === 'addResourceValues' &&
    typeof maxAddFirstValueObj === 'object' &&
    maxAddFirstValueObj !== null &&
    typeof maxAddSecondValueObj === 'object' &&
    maxAddSecondValueObj !== null
  ) {
    const maxAddFirstValue = getValue({
      valueObj: maxAddFirstValueObj,
      keysToValue: minMaxAndStep.max.firstValuesKeysToValue,
      logic,
    })
    const maxAddSecondValue = getValue({
      valueObj: maxAddSecondValueObj,
      keysToValue: minMaxAndStep.max.secondValuesKeysToValue,
      logic,
    })
    maxValue = prepareAddValues({ valueFirst: maxAddFirstValue, valueSecond: maxAddSecondValue })
  }
  if (minMaxAndStep.max.type === 'number') {
    maxValue = minMaxAndStep.max.value
  }

  return {
    minValue,
    maxValue,
  }
}
