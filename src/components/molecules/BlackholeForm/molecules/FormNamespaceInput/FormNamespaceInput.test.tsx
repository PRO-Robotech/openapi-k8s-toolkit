/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import React, { FC } from 'react'
import { Form } from 'antd'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TNamespaceData } from 'localTypes/form'
import { FormNamespaceInput } from './FormNamespaceInput'

jest.mock('components/atoms', () => ({
  MinusIcon: () => <span data-testid="minus-icon">-</span>,
  feedbackIcons: {},
}))

jest.mock('../../atoms', () => ({
  HiddenContainer: ({ children }: any) => <div>{children}</div>,
  CustomSizeTitle: ({ children }: any) => <div>{children}</div>,
  ResetedFormItem: ({ children, name }: any) => <Form.Item name={name}>{children}</Form.Item>,
  DefaultValueButton: () => <button type="button" data-testid="default-value-button" aria-label="Apply default" />,
}))

jest.mock('../../organisms/BlackholeForm/context', () => ({
  useDesignNewLayout: () => false,
}))

jest.mock('../helpers/useDefaultValueButton', () => ({
  useDefaultValueButton: () => ({ visible: false }),
}))

const buildNamespaceData = (values: string[]): NonNullable<TNamespaceData> => ({
  filterSelectOptions: () => true,
  selectValues: values.map(value => ({ label: value, value })),
  disabled: false,
})

type THostProps = {
  initialValues?: Record<string, unknown>
  namespaceData?: TNamespaceData
  defaultValue?: string
  contextNamespace?: string
  onValuesChange?: (changed: any, all: any) => void
  formRef?: React.MutableRefObject<any>
}

const Host: FC<THostProps> = ({
  initialValues,
  namespaceData,
  defaultValue,
  contextNamespace,
  onValuesChange,
  formRef,
}) => {
  const [form] = Form.useForm()
  React.useEffect(() => {
    if (formRef) {
      formRef.current = form
    }
  }, [form, formRef])

  return (
    <Form form={form} initialValues={initialValues} onValuesChange={onValuesChange}>
      <FormNamespaceInput
        name={['metadata', 'namespace']}
        namespaceData={namespaceData}
        removeField={jest.fn()}
        defaultValue={defaultValue}
        contextNamespace={contextNamespace}
      />
    </Form>
  )
}

describe('FormNamespaceInput cascade', () => {
  beforeEach(() => {
    // eslint-disable-next-line no-console
    ;(console.warn as jest.Mock).mockClear()
  })

  test('pre-fills defaultValue when present in selectValues', async () => {
    const formRef = { current: null as any }
    render(
      <Host
        formRef={formRef}
        namespaceData={buildNamespaceData(['default', 'monitoring', 'team-a'])}
        defaultValue="monitoring"
        contextNamespace="team-a"
      />,
    )

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBe('monitoring')
    })
  })

  test('pre-fills contextNamespace when defaultValue is undefined', async () => {
    const formRef = { current: null as any }
    render(
      <Host formRef={formRef} namespaceData={buildNamespaceData(['default', 'team-a'])} contextNamespace="team-a" />,
    )

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBe('team-a')
    })
  })

  test('falls back to contextNamespace when defaultValue is not in selectValues', async () => {
    const formRef = { current: null as any }
    render(
      <Host
        formRef={formRef}
        namespaceData={buildNamespaceData(['default', 'team-a'])}
        defaultValue="monitoring"
        contextNamespace="team-a"
      />,
    )

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBe('team-a')
    })
  })

  test('console.warns when defaultValue is not in selectValues', async () => {
    render(
      <Host
        namespaceData={buildNamespaceData(['default', 'team-a'])}
        defaultValue="monitoring"
        contextNamespace="team-a"
      />,
    )

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Default namespace "monitoring" is not available in this cluster'),
      )
    })
  })

  test('does NOT pre-fill when initialValues already has a namespace (edit mode)', async () => {
    const formRef = { current: null as any }
    render(
      <Host
        formRef={formRef}
        initialValues={{ metadata: { namespace: 'production' } }}
        namespaceData={buildNamespaceData(['default', 'production', 'team-a'])}
        defaultValue="monitoring"
        contextNamespace="team-a"
      />,
    )

    // wait for any potential effects to run
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBe('production')
  })

  test('leaves field empty when neither defaultValue nor contextNamespace is in selectValues', async () => {
    const formRef = { current: null as any }
    render(
      <Host
        formRef={formRef}
        namespaceData={buildNamespaceData(['default', 'team-a'])}
        defaultValue="missing"
        contextNamespace="also-missing"
      />,
    )

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBeUndefined()
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Default namespace "missing" is not available in this cluster'),
    )
  })

  test('leaves field empty when both defaultValue and contextNamespace are undefined', async () => {
    const formRef = { current: null as any }
    render(<Host formRef={formRef} namespaceData={buildNamespaceData(['default', 'team-a'])} />)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBeUndefined()
    expect(console.warn).not.toHaveBeenCalled()
  })

  test('does NOT re-fill after user clears the field (cascade is one-shot on mount)', async () => {
    const formRef = { current: null as any }
    const { rerender } = render(
      <Host formRef={formRef} namespaceData={buildNamespaceData(['default', 'team-a'])} contextNamespace="team-a" />,
    )

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBe('team-a')
    })

    formRef.current.setFieldValue(['metadata', 'namespace'], undefined)
    expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBeUndefined()

    rerender(
      <Host formRef={formRef} namespaceData={buildNamespaceData(['default', 'team-a'])} contextNamespace="team-a" />,
    )

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBeUndefined()
  })

  test('waits for namespaceData before applying cascade', async () => {
    const formRef = { current: null as any }
    const { rerender } = render(<Host formRef={formRef} namespaceData={undefined} contextNamespace="team-a" />)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBeUndefined()

    rerender(
      <Host formRef={formRef} namespaceData={buildNamespaceData(['default', 'team-a'])} contextNamespace="team-a" />,
    )

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['metadata', 'namespace'])).toBe('team-a')
    })
  })
})
