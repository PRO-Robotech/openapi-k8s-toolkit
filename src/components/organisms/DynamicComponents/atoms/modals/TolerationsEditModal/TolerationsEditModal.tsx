/* eslint-disable no-console */
import React, { FC, useState, useEffect, CSSProperties } from 'react'
import { Modal, Form, Alert, Input, Select, Button, Tooltip, Row, Col } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { TRequestError } from 'localTypes/api'
import { ResetedFormItem, CustomSizeTitle } from 'components/molecules/BlackholeForm/atoms'
import { Spacer, PlusIcon, MinusIcon } from 'components/atoms'
import { patchEntryWithReplaceOp } from 'api/forms'
import { TToleration, TTolerationOperator, TTaintEffect } from './types'
import { Styled } from './styled'

type TTolerationsEditModalProps = {
  open: boolean
  close: () => void
  values?: TToleration[]
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

export const TolerationsEditModal: FC<TTolerationsEditModalProps> = ({
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

  const [form] = Form.useForm<{ tolerations: TToleration[] }>()
  const tolerations = Form.useWatch<TToleration[]>('tolerations', form)

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        tolerations: values || [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form])

  const submit = () => {
    form
      .validateFields()
      .then(() => {
        console.log(JSON.stringify(tolerations))
        setIsLoading(true)
        setError(undefined)
        patchEntryWithReplaceOp({ endpoint, pathToValue, body: tolerations })
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

  const operatorOptions: TTolerationOperator[] = ['Exists', 'Equal']
  const effectOptions: TTaintEffect[] = ['NoSchedule', 'PreferNoSchedule', 'NoExecute']

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
      <Form<{ tolerations: TToleration[] }> form={form}>
        {inputLabel && (
          <CustomSizeTitle $designNewLayout style={inputLabelStyle}>
            {inputLabel}
          </CustomSizeTitle>
        )}
        <Spacer $space={10} $samespace />
        <Row gutter={[16, 16]}>
          <Col span={cols[0]}>
            <div>
              <span>
                Key{' '}
                <Tooltip title="Required when operator is Equal; optional for Exists.">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            </div>
          </Col>
          <Col span={cols[1]}>
            <div>Operator</div>
          </Col>
          <Col span={cols[2]}>
            <div>
              <span>
                Value{' '}
                <Tooltip title="Required for Equal; must be empty for Exists.">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            </div>
          </Col>
          <Col span={cols[3]}>
            <div>Effect</div>
          </Col>
          <Col span={cols[4]}>
            <div />
          </Col>
        </Row>
        <Spacer $space={10} $samespace />
        <Styled.ResetedFormList name="tolerations">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={[16, 16]}>
                  <Col span={cols[0]}>
                    <ResetedFormItem
                      {...restField}
                      name={[name, 'key']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, v) {
                            const op = getFieldValue(['tolerations', name, 'operator'])
                            if (op === 'Equal' && (!v || v === '')) {
                              return Promise.reject(new Error('Key is required when operator is Equal.'))
                            }
                            return Promise.resolve()
                          },
                        }),
                      ]}
                    >
                      <Input placeholder="key" />
                    </ResetedFormItem>
                  </Col>

                  <Col span={cols[1]}>
                    <ResetedFormItem
                      {...restField}
                      name={[name, 'operator']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, v) {
                            const nameV = getFieldValue(['tolerations', name, 'key'])
                            if ((nameV === 'nameV' || !nameV) && (!v || v !== 'Exists')) {
                              return Promise.reject(new Error('Operator must be Exists when `key` is empty'))
                            }
                            return Promise.resolve()
                          },
                        }),
                      ]}
                      // rules={[
                      //   { required: true, message: 'Operator is required.' },
                      //   {
                      //     validator: (_, v) =>
                      //       v && operatorOptions.includes(v)
                      //         ? Promise.resolve()
                      //         : Promise.reject(new Error('Select a valid operator.')),
                      //   },
                      // ]}
                    >
                      <Select
                        placeholder="Select operator"
                        options={operatorOptions.map(op => ({ label: op, value: op }))}
                      />
                    </ResetedFormItem>
                  </Col>

                  <Col span={cols[2]}>
                    <ResetedFormItem
                      {...restField}
                      name={[name, 'value']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, v) {
                            const op = getFieldValue(['tolerations', name, 'operator'])
                            if (op === 'Equal' && (!v || v === '')) {
                              return Promise.reject(new Error('Value is required when operator is Equal.'))
                            }
                            return Promise.resolve()
                          },
                        }),
                      ]}
                    >
                      <Input placeholder="value" />
                    </ResetedFormItem>
                  </Col>

                  <Col span={cols[3]}>
                    <ResetedFormItem
                      {...restField}
                      name={[name, 'effect']}
                      // rules={[
                      //   { required: true, message: 'Effect is required.' },
                      //   {
                      //     validator: (_, v) =>
                      //       v && effectOptions.includes(v)
                      //         ? Promise.resolve()
                      //         : Promise.reject(new Error('Select a valid effect.')),
                      //   },
                      // ]}
                    >
                      <Select
                        placeholder="Select effect"
                        options={effectOptions.map(eff => ({ label: eff, value: eff }))}
                      />
                    </ResetedFormItem>
                  </Col>

                  <Col span={cols[4]}>
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
