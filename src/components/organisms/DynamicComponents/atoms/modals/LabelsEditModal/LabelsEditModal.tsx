/* eslint-disable no-console */
/* eslint-disable react/no-unstable-nested-components */
import React, { FC, useState, useEffect, CSSProperties } from 'react'
import { Modal, Form, Alert, Tag, Popover } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { TRequestError } from 'localTypes/api'
import { ResetedFormItem, CustomSizeTitle } from 'components/molecules/BlackholeForm/atoms'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { CustomSelect, Spacer } from 'components/atoms'
import { patchEntryWithReplaceOp } from 'api/forms'
import { truncate } from '../../../utils/truncate'

type TLabelsEditModalProps = {
  open: boolean
  close: () => void
  values?: Record<string, string | number>
  openNotificationSuccess?: () => void
  modalTitle: string
  modalDescriptionText?: string
  inputLabel?: string
  maxEditTagTextLength?: number
  allowClearEditSelect?: boolean
  endpoint: string
  pathToValue: string
  editModalWidth?: number | string
  paddingContainerEnd?: string
  modalDescriptionTextStyle?: CSSProperties
  inputLabelStyle?: CSSProperties
}

export const LabelsEditModal: FC<TLabelsEditModalProps> = ({
  open,
  close,
  values,
  openNotificationSuccess,
  modalTitle,
  modalDescriptionText,
  inputLabel,
  maxEditTagTextLength,
  allowClearEditSelect,
  endpoint,
  pathToValue,
  editModalWidth,
  paddingContainerEnd,
  modalDescriptionTextStyle,
  inputLabelStyle,
}) => {
  const queryClient = useQueryClient()

  const [error, setError] = useState<TRequestError | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [form] = Form.useForm<{ labels: string[] }>()
  const labels = Form.useWatch<string[]>('labels', form)

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        labels: values ? Object.entries(values).map(([key, value]) => `${key}=${value}`) : [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form])

  const submit = () => {
    form
      .validateFields()
      .then(() => {
        const result: Record<string, string> = {}
        labels.forEach(label => {
          const [key, value] = label.split('=')
          result[key] = value || ''
        })
        console.log(JSON.stringify(result))
        setIsLoading(true)
        setError(undefined)
        patchEntryWithReplaceOp({ endpoint, pathToValue, body: result })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['multi'] })
            if (openNotificationSuccess) {
              openNotificationSuccess()
            }
            setIsLoading(false)
            setError(undefined)
            close()
          })
          .catch(error => {
            setIsLoading(false)
            setError(error)
          })
      })
      .catch(() => console.log('Validating error'))
  }

  return (
    <Modal
      title={modalTitle}
      open={open}
      onOk={() => submit()}
      onCancel={() => {
        close()
        form.resetFields()
        setIsLoading(false)
        setError(undefined)
      }}
      okText="Save"
      confirmLoading={isLoading}
      maskClosable={false}
      width={editModalWidth || 520}
      destroyOnHidden
      centered
    >
      {error && <Alert type="error" message="Error while submitting" description={error?.response?.data?.message} />}
      {modalDescriptionText && (
        <>
          <div style={modalDescriptionTextStyle}>{modalDescriptionText}</div>
          <Spacer $space={10} $samespace />
        </>
      )}
      <Form<{ labels: string[] }> form={form}>
        {inputLabel && (
          <CustomSizeTitle $designNewLayout style={inputLabelStyle}>
            {inputLabel}
          </CustomSizeTitle>
        )}
        <Spacer $space={10} $samespace />
        <ResetedFormItem
          name="labels"
          hasFeedback
          validateTrigger="onBlur"
          rules={[
            () => ({
              validator(_, value) {
                if (
                  Array.isArray(value) &&
                  value.every(str => typeof str === 'string' && str.includes('=') && !str.startsWith('='))
                ) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Please enter key=value style'))
              },
            }),
          ]}
        >
          <CustomSelect
            mode="tags"
            placeholder="Enter key=value"
            filterOption={filterSelectOptions}
            allowClear={allowClearEditSelect}
            tokenSeparators={[' ']}
            open={false}
            tagRender={({ label, closable, onClose }) => {
              return (
                <Popover content={label}>
                  <Tag
                    closable={closable}
                    onClose={onClose}
                    onClick={e => {
                      e.stopPropagation()
                    }}
                  >
                    {typeof label === 'string' ? truncate(label, maxEditTagTextLength) : 'Not a string value'}
                  </Tag>
                </Popover>
              )
            }}
            paddingContainerEnd={paddingContainerEnd}
          />
        </ResetedFormItem>
      </Form>
    </Modal>
  )
}
