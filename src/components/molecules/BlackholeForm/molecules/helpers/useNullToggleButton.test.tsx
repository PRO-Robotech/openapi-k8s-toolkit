import React, { FC, PropsWithChildren } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import { TFormName } from 'localTypes/form'
import { useNullToggleButton } from './useNullToggleButton'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ValueHolder: FC<Record<string, unknown>> = _props => null

// eslint-disable-next-line react/prop-types
const makeWrapper = (fieldName: TFormName, initialValues?: Record<string, unknown>): FC<PropsWithChildren> => {
  const Wrapper: FC<PropsWithChildren> = ({ children }) => {
    const [form] = Form.useForm()

    return (
      <Form form={form} initialValues={initialValues}>
        <Form.Item name={fieldName} noStyle>
          <ValueHolder />
        </Form.Item>
        {children}
      </Form>
    )
  }

  return Wrapper
}

describe('useNullToggleButton', () => {
  it('returns visible: false when nullable is not true', () => {
    const { result: noFlag } = renderHook(() => useNullToggleButton('foo'), { wrapper: makeWrapper('foo') })
    expect(noFlag.current.visible).toBe(false)

    const { result: explicitFalse } = renderHook(() => useNullToggleButton('foo', false), {
      wrapper: makeWrapper('foo'),
    })
    expect(explicitFalse.current.visible).toBe(false)
  })

  it('is visible with isNull=false when field has a non-null value', async () => {
    const { result } = renderHook(() => useNullToggleButton('schedule', true), {
      wrapper: makeWrapper('schedule', { schedule: '0 2 * * *' }),
    })

    await waitFor(() => {
      expect(result.current.visible).toBe(true)
    })

    if (result.current.visible) {
      expect(result.current.isNull).toBe(false)
    }
  })

  it('is visible with isNull=true when field is null', async () => {
    const { result } = renderHook(() => useNullToggleButton('schedule', true), {
      wrapper: makeWrapper('schedule', { schedule: null }),
    })

    await waitFor(() => {
      expect(result.current.visible).toBe(true)
    })

    if (result.current.visible) {
      expect(result.current.isNull).toBe(true)
    }
  })

  it('handleSetNull sets field value to null', async () => {
    const { result } = renderHook(() => useNullToggleButton('schedule', true), {
      wrapper: makeWrapper('schedule'),
    })

    expect(result.current.visible).toBe(true)
    if (!result.current.visible) return

    act(() => {
      if (result.current.visible) {
        result.current.handleSetNull()
      }
    })

    await waitFor(() => {
      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isNull).toBe(true)
      }
    })
  })

  it('handleClear clears field value back to undefined (isNull flips to false)', async () => {
    const { result } = renderHook(() => useNullToggleButton('schedule', true), {
      wrapper: makeWrapper('schedule', { schedule: null }),
    })

    await waitFor(() => {
      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isNull).toBe(true)
      }
    })

    act(() => {
      if (result.current.visible) {
        result.current.handleClear()
      }
    })

    await waitFor(() => {
      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isNull).toBe(false)
      }
    })
  })

  it('works with nested array-style field names', async () => {
    const fieldName: TFormName = ['spec', 'backup', 'schedule']

    const { result } = renderHook(() => useNullToggleButton(fieldName, true), {
      wrapper: makeWrapper(fieldName, { spec: { backup: { schedule: null } } }),
    })

    await waitFor(() => {
      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isNull).toBe(true)
      }
    })
  })
})
