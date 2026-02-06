/* eslint-disable no-console */
import React, { FC, useState, useEffect, CSSProperties } from 'react'
import { Modal, Form, Alert, Input, Button, Row, Col } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { TRequestError } from 'localTypes/api'
import { ResetedFormItem, CustomSizeTitle } from 'components/molecules/BlackholeForm/atoms'
import { Spacer, PlusIcon, MinusIcon } from 'components/atoms'
import { patchEntryWithReplaceOp } from 'api/forms'
import { TStringNumberRecord } from './types'
import { Styled } from './styled'

type TAnnotationsEditModalProps = {
  open: boolean
  close: () => void
  values?: TStringNumberRecord
  openNotificationSuccess?: () => void
  disableSubmit?: boolean
  modalTitle: string
  modalDescriptionText?: string
  inputLabel?: string
  endpoint: string
  pathToValue: string
  editModalWidth?: number | string
  cols: number[]
  modalDescriptionTextStyle?: CSSProperties
  inputLabelStyle?: CSSProperties
}

export const AnnotationsEditModal: FC<TAnnotationsEditModalProps> = ({
  open,
  close,
  values,
  openNotificationSuccess,
  disableSubmit,
  modalTitle,
  modalDescriptionText,
  inputLabel,
  endpoint,
  pathToValue,
  editModalWidth,
  cols,
  modalDescriptionTextStyle,
  inputLabelStyle,
}) => {
  const queryClient = useQueryClient()

  const [error, setError] = useState<TRequestError | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [form] = Form.useForm<{ annotations: { key: string; value?: string }[] }>()
  const annotations = Form.useWatch<{ key: string; value?: string }[]>('annotations', form)

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        annotations: values
          ? Object.entries(values).map(([key, value]) => ({
              key,
              value,
            }))
          : [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form])

  const submit = () => {
    form
      .validateFields()
      .then(() => {
        const result: Record<string, string> = {}
        annotations.forEach(({ key, value }) => {
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
      okButtonProps={{ disabled: disableSubmit }}
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
      <Form<{ annotations: { key: string; value?: string }[] }> form={form}>
        {inputLabel && (
          <CustomSizeTitle $designNewLayout style={inputLabelStyle}>
            {inputLabel}
          </CustomSizeTitle>
        )}
        <Spacer $space={10} $samespace />
        <Row gutter={[16, 16]}>
          <Col span={cols[0]}>
            <div>Key</div>
          </Col>
          <Col span={cols[1]}>
            <div>Value</div>
          </Col>
          <Col span={cols[2]}>
            <div />
          </Col>
        </Row>
        <Spacer $space={10} $samespace />
        <Styled.ResetedFormList name="annotations">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={[16, 16]}>
                  <Col span={cols[0]}>
                    <ResetedFormItem
                      {...restField}
                      name={[name, 'key']}
                      rules={[{ required: true, message: 'Key is required' }]}
                    >
                      <Input placeholder="key" />
                    </ResetedFormItem>
                  </Col>

                  <Col span={cols[1]}>
                    <ResetedFormItem {...restField} name={[name, 'value']}>
                      <Input placeholder="value" />
                    </ResetedFormItem>
                  </Col>

                  <Col span={cols[2]}>
                    <Button size="small" type="text" onClick={() => remove(name)}>
                      <MinusIcon />
                    </Button>
                  </Col>
                </Row>
              ))}

              <ResetedFormItem>
                <Button type="text" size="small" onClick={() => add()}>
                  <PlusIcon />
                </Button>
              </ResetedFormItem>
            </>
          )}
        </Styled.ResetedFormList>
      </Form>
    </Modal>
  )
}
