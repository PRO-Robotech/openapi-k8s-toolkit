/* eslint-disable max-lines-per-function */
import React, { FC } from 'react'
import { theme as antdtheme, Form, Select, Input, SelectProps, Button, Checkbox, Flex, FormInstance } from 'antd'
import { useSearchParams } from 'react-router-dom'
import type { CustomTagProps } from 'rc-select/lib/BaseSelect'
import { BaseOptionType } from 'antd/es/select'
import { ClearOutlined } from '@ant-design/icons'
import { TKindWithVersion } from 'localTypes/search'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { hslFromString } from 'utils/hslFromString'
import { getUppercase } from 'utils/getUppercase'
import { kindByGvr } from 'utils/kindByGvr'
import { Styled } from './styled'

export type TSearchProps = {
  cluster: string
  theme: 'light' | 'dark'
  form: FormInstance
  constants: {
    FIELD_NAME: string
    FIELD_NAME_STRING: string
    FIELD_NAME_LABELS: string
    FIELD_NAME_FIELDS: string
    TYPE_SELECTOR: string
  }
  kindsWithVersion: TKindWithVersion[]
}

export const Search: FC<TSearchProps> = ({ theme, form, constants, kindsWithVersion }) => {
  const { token } = antdtheme.useToken()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sp, setSearchParams] = useSearchParams()

  const { FIELD_NAME, FIELD_NAME_STRING, FIELD_NAME_LABELS, FIELD_NAME_FIELDS, TYPE_SELECTOR } = constants

  const watchedKinds = Form.useWatch<string[] | undefined>(FIELD_NAME, form)
  const watchedName = Form.useWatch<string | undefined>(FIELD_NAME_STRING, form)
  const watchedLabels = Form.useWatch<string[] | undefined>(FIELD_NAME_LABELS, form)
  const watchedFields = Form.useWatch<string[] | undefined>(FIELD_NAME_FIELDS, form)
  const watchedTypedSelector = Form.useWatch<string | undefined>(TYPE_SELECTOR, form)

  const options: SelectProps['options'] =
    kindsWithVersion
      .filter(({ version }) => version.verbs && version.verbs.includes('list'))
      .map(({ kind, group, version }) => {
        const abbr = getUppercase(kind)
        const bgColor = kind && kind.length ? hslFromString(kind, theme) : ''
        return {
          label: (
            <Flex gap={8} align="center">
              {bgColor.length && <Styled.Abbr $bgColor={bgColor}>{abbr}</Styled.Abbr>}
              <Flex gap={2} vertical>
                <Styled.OptionLabelKind>{kind}</Styled.OptionLabelKind>
                <Styled.OptionLabelVersion>{version.groupVersion}</Styled.OptionLabelVersion>
              </Flex>
            </Flex>
          ),
          value: `${group}~${version.version}~${version.resource}`,
        }
      }) || []

  const tagRender = ({ label, closable, onClose }: CustomTagProps) => (
    <Styled.SelectTag
      onMouseDown={e => {
        // prevent the Select from toggling open when clicking the tag
        e.preventDefault()
        e.stopPropagation()
      }}
      closable={closable}
      onClose={onClose}
    >
      <Styled.SelectTagSpan>{label}</Styled.SelectTagSpan>
    </Styled.SelectTag>
  )

  const maxTagPlaceholder = () => (
    <div>
      Kinds{' '}
      <Styled.MaxTagPlacheolderLength $colorBorder={token.colorBorder}>
        {watchedKinds?.length ? watchedKinds.length : '0'}
      </Styled.MaxTagPlacheolderLength>
    </div>
  )

  const maxTagTagRender = ({ label }: CustomTagProps) => <Styled.MaxTagPlacheolder>{label}</Styled.MaxTagPlacheolder>

  const getKindByGvr = kindByGvr(kindsWithVersion)

  const removeKind = (value: string) => {
    const cur: string[] = form.getFieldValue(FIELD_NAME) || []
    form.setFieldsValue({ [FIELD_NAME]: cur.filter(v => v !== value) })
  }

  const clearName = () => {
    form.setFieldsValue({ [FIELD_NAME_STRING]: '' })
  }

  const removeLabel = (label: string) => {
    const cur: string[] = form.getFieldValue(FIELD_NAME_LABELS) || []
    form.setFieldsValue({ [FIELD_NAME_LABELS]: cur.filter(v => v !== label) })
  }

  const removeField = (field: string) => {
    const cur: string[] = form.getFieldValue(FIELD_NAME_FIELDS) || []
    form.setFieldsValue({ [FIELD_NAME_FIELDS]: cur.filter(v => v !== field) })
  }

  const kindOptionRender = (option: BaseOptionType) => {
    const selectedList: string[] = form.getFieldValue(FIELD_NAME) || []
    const checked = selectedList.includes(option.value as string)

    return (
      <Flex gap={8} align="center">
        <div>
          <Checkbox checked={checked} />
        </div>
        <div>{option.label as React.ReactNode}</div>
      </Flex>
    )
  }

  return (
    <Styled.BackgroundContainer
      $colorBorder={token.colorBorder}
      $colorBgLayout={token.colorBgLayout}
      $visibleBackground={Boolean(
        (watchedKinds && watchedKinds.length) ||
          (watchedName && watchedName.length) ||
          (watchedLabels && watchedLabels.length) ||
          (watchedFields && watchedFields.length),
      )}
    >
      <Form form={form} layout="vertical">
        <Styled.FormContainer>
          <Styled.ResetedFormItem name={FIELD_NAME}>
            <Select
              mode="multiple"
              placeholder="Select kinds"
              options={options}
              filterOption={(input, option) =>
                (option?.value || '').toString().toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              showSearch
              // tagRender={tagRender}
              // maxTagCount="responsive"
              maxTagCount={0}
              maxTagPlaceholder={maxTagPlaceholder}
              tagRender={maxTagTagRender}
              // Render each option row with a checkbox that reflects selection
              menuItemSelectedIcon={null}
              optionRender={kindOptionRender}
            />
          </Styled.ResetedFormItem>
          {/* <Styled.CompoundItem> */}
          <Styled.ResetedFormItem name={TYPE_SELECTOR}>
            <Select
              placeholder="Select"
              options={[
                { label: 'Name', value: 'name' },
                { label: 'Labels', value: 'labels' },
                { label: 'Fields', value: 'fields' },
              ]}
              defaultValue="name"
              filterOption={filterSelectOptions}
              showSearch
            />
          </Styled.ResetedFormItem>
          <Styled.HideableContainer $isHidden={watchedTypedSelector === 'labels' || watchedTypedSelector === 'fields'}>
            <Styled.ResetedFormItem name={FIELD_NAME_STRING}>
              <Input allowClear placeholder="Name" disabled={!watchedKinds || !watchedKinds.length} />
            </Styled.ResetedFormItem>
          </Styled.HideableContainer>
          <Styled.HideableContainer
            $isHidden={
              watchedTypedSelector === 'name' || watchedTypedSelector === 'fields' || watchedTypedSelector === undefined
            }
          >
            <Styled.ResetedFormItem
              name={FIELD_NAME_LABELS}
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
              <Select
                mode="tags"
                allowClear
                placeholder="Key=Value"
                tokenSeparators={[',', ' ', '	']}
                suffixIcon={null}
                filterOption={filterSelectOptions}
                tagRender={tagRender}
                maxTagCount="responsive"
                disabled={!watchedKinds || !watchedKinds.length}
                styles={{
                  popup: {
                    root: {
                      display: 'none',
                    },
                  },
                }}
              />
            </Styled.ResetedFormItem>
          </Styled.HideableContainer>
          <Styled.HideableContainer
            $isHidden={
              watchedTypedSelector === 'name' || watchedTypedSelector === 'labels' || watchedTypedSelector === undefined
            }
          >
            <Styled.ResetedFormItem
              name={FIELD_NAME_FIELDS}
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
              <Select
                mode="tags"
                allowClear
                placeholder="Key=Value"
                tokenSeparators={[',', ' ', '	']}
                suffixIcon={null}
                filterOption={filterSelectOptions}
                tagRender={tagRender}
                maxTagCount="responsive"
                disabled={!watchedKinds || !watchedKinds.length}
                styles={{
                  popup: {
                    root: {
                      display: 'none',
                    },
                  },
                }}
              />
            </Styled.ResetedFormItem>
          </Styled.HideableContainer>
          {/* </Styled.CompoundItem> */}
        </Styled.FormContainer>
      </Form>
      {(watchedKinds && watchedKinds.length) ||
      (watchedName && watchedName.length) ||
      (watchedLabels && watchedLabels.length) ||
      (watchedFields && watchedFields.length) ? (
        <Styled.BottomTagsContainer>
          <Styled.OptionsFlex>
            {watchedKinds && watchedKinds.length > 0 && (
              <Styled.BottomTagsRow>
                <Styled.BottomTagsRowText $colorDescription={token.colorTextDescription}>
                  Kinds:
                </Styled.BottomTagsRowText>
                <Styled.BottomTagsHolder>
                  {watchedKinds.map(fullKindName => {
                    const kind = getKindByGvr(fullKindName)
                    const abbr = getUppercase(kind && kind.length ? kind : 'Loading')
                    const bgColor = kind && kind.length ? hslFromString(kind, theme) : ''
                    return (
                      <Styled.CustomTag
                        key={fullKindName}
                        onClose={e => {
                          e.preventDefault()
                          removeKind(fullKindName)
                        }}
                        closable
                      >
                        {kind && kind.length && bgColor.length && <Styled.Abbr $bgColor={bgColor}>{abbr}</Styled.Abbr>}
                        {kind}
                      </Styled.CustomTag>
                    )
                  })}
                </Styled.BottomTagsHolder>
              </Styled.BottomTagsRow>
            )}
            {watchedName && watchedName.length > 0 && (
              <Styled.BottomTagsRow>
                <Styled.BottomTagsRowText $colorDescription={token.colorTextDescription}>
                  Name:
                </Styled.BottomTagsRowText>
                <Styled.BottomTagsHolder>
                  <Styled.CustomTag
                    onClose={e => {
                      e.preventDefault()
                      clearName()
                    }}
                    closable
                  >
                    {watchedName}
                  </Styled.CustomTag>
                </Styled.BottomTagsHolder>
              </Styled.BottomTagsRow>
            )}
            {watchedLabels && watchedLabels.length > 0 && (
              <Styled.BottomTagsRow>
                <Styled.BottomTagsRowText $colorDescription={token.colorTextDescription}>
                  Labels:
                </Styled.BottomTagsRowText>
                <Styled.BottomTagsHolder>
                  {watchedLabels.map(label => (
                    <Styled.CustomTag
                      key={label}
                      onClose={e => {
                        e.preventDefault()
                        removeLabel(label)
                      }}
                      closable
                    >
                      {label}
                    </Styled.CustomTag>
                  ))}
                </Styled.BottomTagsHolder>
              </Styled.BottomTagsRow>
            )}
            {watchedFields && watchedFields.length > 0 && (
              <Styled.BottomTagsRow>
                <Styled.BottomTagsRowText $colorDescription={token.colorTextDescription}>
                  Fields:
                </Styled.BottomTagsRowText>
                <Styled.BottomTagsHolder>
                  {watchedFields.map(field => (
                    <Styled.CustomTag
                      key={field}
                      onClose={e => {
                        e.preventDefault()
                        removeField(field)
                      }}
                      closable
                    >
                      {field}
                    </Styled.CustomTag>
                  ))}
                </Styled.BottomTagsHolder>
              </Styled.BottomTagsRow>
            )}
          </Styled.OptionsFlex>
          <Styled.ClearButtonHolder>
            <Button
              type="primary"
              onClick={() => {
                setSearchParams(new URLSearchParams())
                form.setFieldsValue({
                  [FIELD_NAME]: [],
                  [FIELD_NAME_STRING]: '',
                  [FIELD_NAME_LABELS]: [],
                  [FIELD_NAME_FIELDS]: [],
                  [TYPE_SELECTOR]: 'name', // reset selector to default
                })
              }}
            >
              <ClearOutlined />
            </Button>
          </Styled.ClearButtonHolder>
        </Styled.BottomTagsContainer>
      ) : undefined}
    </Styled.BackgroundContainer>
  )
}
