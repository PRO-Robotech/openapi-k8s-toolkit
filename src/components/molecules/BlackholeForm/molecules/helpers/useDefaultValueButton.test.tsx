import React, { FC, PropsWithChildren } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import { TFormName } from 'localTypes/form'
import { useDefaultValueButton } from './useDefaultValueButton'

/**
 * Wrapper that provides Ant Design Form context required by useDefaultValueButton.
 *
 * IMPORTANT: Form.useWatch only sees values for fields that have a matching
 * Form.Item rendered in the DOM. We render a hidden Form.Item with the
 * target field name so useWatch can pick up initialValues.
 */
// eslint-disable-next-line react/prop-types
const makeWrapper = (fieldName: TFormName, initialValues?: Record<string, unknown>): FC<PropsWithChildren> => {
  const Wrapper: FC<PropsWithChildren> = ({ children }) => {
    const [form] = Form.useForm()
    return (
      <Form form={form} initialValues={initialValues}>
        <Form.Item name={fieldName} noStyle>
          <input />
        </Form.Item>
        {children}
      </Form>
    )
  }
  return Wrapper
}

describe('useDefaultValueButton', () => {
  describe('visibility rules', () => {
    it('returns visible: false when defaultValue is undefined', () => {
      const { result } = renderHook(() => useDefaultValueButton('protocol', undefined), {
        wrapper: makeWrapper('protocol'),
      })

      expect(result.current.visible).toBe(false)
    })

    it('returns visible: true, isApplied: false when field is empty and default exists', () => {
      const { result } = renderHook(() => useDefaultValueButton('protocol', 'TCP'), {
        wrapper: makeWrapper('protocol'),
      })

      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(false)
      }
    })

    it('returns visible: true, isApplied: true when field value equals default', async () => {
      const { result } = renderHook(() => useDefaultValueButton('protocol', 'TCP'), {
        wrapper: makeWrapper('protocol', { protocol: 'TCP' }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
      })
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(true)
      }
    })

    it('returns visible: false when field has a different value (user input or prefill)', async () => {
      const { result } = renderHook(() => useDefaultValueButton('protocol', 'TCP'), {
        wrapper: makeWrapper('protocol', { protocol: 'UDP' }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(false)
      })
    })
  })

  describe('falsy defaults', () => {
    it('handles default 0 correctly (field empty → show apply)', () => {
      const { result } = renderHook(() => useDefaultValueButton('minReady', 0), {
        wrapper: makeWrapper('minReady'),
      })

      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(false)
      }
    })

    it('handles default false correctly (field empty → show apply)', () => {
      const { result } = renderHook(() => useDefaultValueButton('debug', false), {
        wrapper: makeWrapper('debug'),
      })

      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(false)
      }
    })

    it('handles default 0 when field value is 0 (isApplied: true)', async () => {
      const { result } = renderHook(() => useDefaultValueButton('minReady', 0), {
        wrapper: makeWrapper('minReady', { minReady: 0 }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
      })
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(true)
      }
    })
  })

  describe('onApply action', () => {
    it('sets the field value to defaultValue', async () => {
      const { result } = renderHook(() => useDefaultValueButton('replicas', 3), {
        wrapper: makeWrapper('replicas'),
      })

      expect(result.current.visible).toBe(true)
      const state = result.current
      if (!state.visible) return

      act(() => {
        state.handleApply()
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
        if (result.current.visible) {
          expect(result.current.isApplied).toBe(true)
        }
      })
    })
  })

  describe('onClear action', () => {
    it('clears the field value back to undefined', async () => {
      const { result } = renderHook(() => useDefaultValueButton('replicas', 3), {
        wrapper: makeWrapper('replicas', { replicas: 3 }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
      })
      const state = result.current
      if (!state.visible) return

      act(() => {
        state.handleClear()
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
        if (result.current.visible) {
          expect(result.current.isApplied).toBe(false)
        }
      })
    })
  })

  describe('prefill priority', () => {
    it('hides button when prefill sets a non-default value', async () => {
      const { result } = renderHook(() => useDefaultValueButton('replicas', 3), {
        wrapper: makeWrapper('replicas', { replicas: 5 }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(false)
      })
    })

    it('shows clear when prefill equals the default', async () => {
      const { result } = renderHook(() => useDefaultValueButton('replicas', 3), {
        wrapper: makeWrapper('replicas', { replicas: 3 }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
      })
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(true)
      }
    })
  })

  describe('array field names', () => {
    it('works with array-style field names', async () => {
      const fieldName: TFormName = ['spec', 'protocol']
      const { result } = renderHook(() => useDefaultValueButton(fieldName, 'TCP'), {
        wrapper: makeWrapper(fieldName, { spec: { protocol: 'TCP' } }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
      })
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(true)
      }
    })
  })

  describe('string array defaults (listInput fields)', () => {
    it('shows apply when field is empty and default is string[]', () => {
      const { result } = renderHook(() => useDefaultValueButton('protocols', ['TCP', 'UDP']), {
        wrapper: makeWrapper('protocols'),
      })

      expect(result.current.visible).toBe(true)
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(false)
      }
    })

    it('shows apply when field is empty array and default is string[]', async () => {
      const { result } = renderHook(() => useDefaultValueButton('protocols', ['TCP', 'UDP']), {
        wrapper: makeWrapper('protocols', { protocols: [] }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
      })
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(false)
      }
    })

    it('shows clear when field value deeply equals default array', async () => {
      const { result } = renderHook(() => useDefaultValueButton('protocols', ['TCP', 'UDP']), {
        wrapper: makeWrapper('protocols', { protocols: ['TCP', 'UDP'] }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
      })
      if (result.current.visible) {
        expect(result.current.isApplied).toBe(true)
      }
    })

    it('hides button when field has different array value', async () => {
      const { result } = renderHook(() => useDefaultValueButton('protocols', ['TCP', 'UDP']), {
        wrapper: makeWrapper('protocols', { protocols: ['SCTP'] }),
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(false)
      })
    })

    it('apply → clear round-trip works for array defaults', async () => {
      const { result } = renderHook(() => useDefaultValueButton('protocols', ['TCP', 'UDP']), {
        wrapper: makeWrapper('protocols'),
      })

      // initially: empty → show apply
      expect(result.current.visible).toBe(true)
      if (!result.current.visible) return
      expect(result.current.isApplied).toBe(false)

      // apply
      act(() => {
        result.current.visible && result.current.handleApply()
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
        if (result.current.visible) {
          expect(result.current.isApplied).toBe(true)
        }
      })

      // clear
      act(() => {
        result.current.visible && result.current.handleClear()
      })

      await waitFor(() => {
        expect(result.current.visible).toBe(true)
        if (result.current.visible) {
          expect(result.current.isApplied).toBe(false)
        }
      })
    })
  })
})
