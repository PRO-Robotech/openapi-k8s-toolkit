import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Form } from 'antd'
import { TPersistedControls } from 'localTypes/form'
import { HiddenPathsProvider } from '../../organisms/BlackholeForm/context'
import { FormStringMultilineInput } from './FormStringMultilineInput'
import { toBase64 } from './helpers'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const util = require('util')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (global as any).TextEncoder === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).TextEncoder = util.TextEncoder
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (global as any).TextDecoder === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).TextDecoder = util.TextDecoder
  }
})

const persistedControls: TPersistedControls = {
  onPersistMark: jest.fn(),
  onPersistUnmark: jest.fn(),
  persistedKeys: [],
}

const removeField = jest.fn()

type TNestedArrayHarnessProps = {
  onSnapshot: (values: unknown) => void
}

const NestedArrayHarness = ({ onSnapshot }: TNestedArrayHarnessProps) => {
  const [form] = Form.useForm()

  return (
    <Form form={form} initialValues={{ spec: { secrets: [{ data: {} }] } }}>
      <HiddenPathsProvider value={[]}>
        <Form.List name={['spec', 'secrets']}>
          {fields =>
            fields.map(field => (
              <FormStringMultilineInput
                key={field.key}
                name={['spec', 'secrets', field.name, 'data', 'payload']}
                arrName={[field.name, 'data', 'payload']}
                removeField={removeField}
                persistedControls={persistedControls}
                isBase64
              />
            ))
          }
        </Form.List>
      </HiddenPathsProvider>
      <button type="button" onClick={() => onSnapshot(form.getFieldsValue(true))}>
        snapshot
      </button>
    </Form>
  )
}

describe('FormStringMultilineInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('writes base64 multiline values to the absolute path when rendered inside Form.List', () => {
    const onSnapshot = jest.fn()

    render(<NestedArrayHarness onSnapshot={onSnapshot} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello from array item' } })
    fireEvent.click(screen.getByRole('button', { name: 'snapshot' }))

    expect(onSnapshot).toHaveBeenCalledWith({
      spec: {
        secrets: [
          {
            data: {
              payload: toBase64('hello from array item'),
            },
          },
        ],
      },
    })
    expect(onSnapshot).not.toHaveBeenCalledWith(expect.objectContaining({ 0: expect.anything() }))
  })
})
