export const getResult = ({
  valuesPrepared,
  criteriaSuccess,
  criteriaError,
  strategySuccess,
  strategyError,
  valueToCompareSuccess,
  valueToCompareError,
  successText,
  errorText,
  fallbackText,
}: {
  valuesPrepared: string[]
  criteriaSuccess: 'equals' | 'notEquals'
  criteriaError: 'equals' | 'notEquals'
  strategySuccess?: 'some' | 'every'
  strategyError?: 'some' | 'every'
  valueToCompareSuccess: unknown[]
  valueToCompareError: unknown[]
  successText: string
  errorText: string
  fallbackText: string
}): { type: 'success' | 'danger' | 'warning'; text: string } => {
  let success = false

  if (strategySuccess === 'some') {
    success =
      criteriaSuccess === 'equals'
        ? valuesPrepared.some(v => valueToCompareSuccess.includes(v))
        : valuesPrepared.some(v => !valueToCompareSuccess.includes(v))
  } else {
    success =
      criteriaSuccess === 'equals'
        ? valuesPrepared.every(v => valueToCompareSuccess.includes(v))
        : valuesPrepared.every(v => !valueToCompareSuccess.includes(v))
  }

  if (success) {
    return { type: 'success', text: successText }
  }

  let error = false
  if (strategyError === 'some') {
    error =
      criteriaError === 'equals'
        ? valuesPrepared.some(v => valueToCompareError.includes(v))
        : valuesPrepared.some(v => !valueToCompareError.includes(v))
  } else {
    error =
      criteriaError === 'equals'
        ? valuesPrepared.every(v => valueToCompareError.includes(v))
        : valuesPrepared.every(v => !valueToCompareError.includes(v))
  }

  if (error) {
    return { type: 'danger', text: errorText }
  }

  return { type: 'warning', text: fallbackText }
}
