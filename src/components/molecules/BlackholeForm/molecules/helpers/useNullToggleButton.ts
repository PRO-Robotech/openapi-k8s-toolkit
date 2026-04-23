import { useCallback, useMemo } from 'react'
import { Form } from 'antd'
import { TFormName } from 'localTypes/form'

type TNullToggleButtonState =
  | { visible: false }
  | { visible: true; isNull: boolean; handleSetNull: () => void; handleClear: () => void }

/**
 * Surfaces a "Set null / Clear null" control only for schema nodes marked `nullable: true`.
 * `null` is a distinct, persisted value (not the same as empty-and-omitted); consumers must
 * propagate it through the submit pipeline for nullable paths.
 */
export const useNullToggleButton = (formFieldName: TFormName, nullable?: boolean): TNullToggleButtonState => {
  const form = Form.useFormInstance()
  const currentValue = Form.useWatch(formFieldName, form)

  const handleSetNull = useCallback(() => {
    form.setFieldValue(formFieldName, null)
  }, [form, formFieldName])

  const handleClear = useCallback(() => {
    form.setFieldValue(formFieldName, undefined)
  }, [form, formFieldName])

  return useMemo(() => {
    if (!nullable) {
      return { visible: false }
    }

    return {
      visible: true,
      isNull: currentValue === null,
      handleSetNull,
      handleClear,
    }
  }, [nullable, currentValue, handleSetNull, handleClear])
}
