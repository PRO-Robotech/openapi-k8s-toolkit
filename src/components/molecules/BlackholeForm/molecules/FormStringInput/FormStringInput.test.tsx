import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Form } from 'antd'
import { TPersistedControls } from 'localTypes/form'
import { HiddenPathsProvider, OnValuesChangeCallbackProvider } from '../../organisms/BlackholeForm/context'
import { FormStringInput } from './FormStringInput'

const persistedControls: TPersistedControls = {
  onPersistMark: jest.fn(),
  onPersistUnmark: jest.fn(),
  persistedKeys: [],
}

const removeField = jest.fn()

type TNestedArrayHarnessProps = {
  onSnapshot: (values: unknown) => void
  onValuesChangeCallback: () => void
}

const NestedArrayHarness = ({ onSnapshot, onValuesChangeCallback }: TNestedArrayHarnessProps) => {
  const [form] = Form.useForm()

  return (
    <Form form={form} initialValues={{ spec: { volumes: [{ azureDisk: {} }] } }}>
      <HiddenPathsProvider value={[]}>
        <OnValuesChangeCallbackProvider value={onValuesChangeCallback}>
          <Form.List name={['spec', 'volumes']}>
            {fields =>
              fields.map(field => (
                <FormStringInput
                  key={field.key}
                  name={['spec', 'volumes', field.name, 'azureDisk', 'cachingMode']}
                  arrName={[field.name, 'azureDisk', 'cachingMode']}
                  removeField={removeField}
                  persistedControls={persistedControls}
                  defaultValue="ReadWrite"
                />
              ))
            }
          </Form.List>
        </OnValuesChangeCallbackProvider>
      </HiddenPathsProvider>
      <button type="button" onClick={() => onSnapshot(form.getFieldsValue(true))}>
        snapshot
      </button>
    </Form>
  )
}

describe('FormStringInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('applies default to the absolute path when rendered inside Form.List', () => {
    const onSnapshot = jest.fn()
    const onValuesChangeCallback = jest.fn()

    render(<NestedArrayHarness onSnapshot={onSnapshot} onValuesChangeCallback={onValuesChangeCallback} />)

    fireEvent.click(screen.getByRole('button', { name: 'Apply default' }))
    fireEvent.click(screen.getByRole('button', { name: 'snapshot' }))

    expect(onSnapshot).toHaveBeenCalledWith({
      spec: {
        volumes: [
          {
            azureDisk: {
              cachingMode: 'ReadWrite',
            },
          },
        ],
      },
    })
    expect(onSnapshot).not.toHaveBeenCalledWith(expect.objectContaining({ 0: expect.anything() }))
    expect(onValuesChangeCallback).toHaveBeenCalledTimes(1)
  })
})
