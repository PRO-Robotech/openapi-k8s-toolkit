/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Form, Input } from 'antd'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FormObjectFromSwagger } from './FormObjectFromSwagger'

jest.mock('components/atoms', () => ({
  PlusIcon: () => <span data-testid="plus-icon">+</span>,
}))

jest.mock('../../atoms', () => ({
  HiddenContainer: ({ children }: any) => <div>{children}</div>,
  CustomSizeTitle: ({ children }: any) => <div>{children}</div>,
  PersistedCheckbox: () => null,
  CustomCollapse: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('../../organisms/BlackholeForm/context', () => ({
  useDesignNewLayout: () => false,
}))

const TestHost: FC<{ initialKeys?: string[] }> = ({ initialKeys = [] }) => {
  const [keys, setKeys] = React.useState<string[]>(initialKeys)

  return (
    <Form>
      <FormObjectFromSwagger
        name={['spec']}
        removeField={jest.fn()}
        expandedControls={{
          expandedKeys: [],
          onExpandOpen: jest.fn(),
          onExpandClose: jest.fn(),
        }}
        persistedControls={{
          persistedKeys: [],
          onPersistMark: jest.fn(),
          onPersistUnmark: jest.fn(),
        }}
        collapseTitle="extra"
        collapseFormName={['spec', 'extra']}
        inputProps={{
          additionalProperties: { type: 'string' } as any,
          addField: ({ name }) => setKeys(prev => [...prev, name]),
        }}
        data={
          <>
            {keys.map(key => (
              <Form.Item key={key} name={['spec', 'extra', key]}>
                <Input data-testid={`created-input-${key}`} />
              </Form.Item>
            ))}
          </>
        }
      />
    </Form>
  )
}

describe('FormObjectFromSwagger', () => {
  let rafSpy: jest.SpyInstance

  beforeEach(() => {
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    rafSpy.mockRestore()
  })

  test('does not auto focus existing additional property field on mount', () => {
    render(<TestHost initialKeys={['existing']} />)

    expect(screen.getByTestId('created-input-existing')).toBeInTheDocument()
    expect(screen.getByTestId('created-input-existing')).not.toHaveFocus()
  })

  test('focuses newly added additional property field after add action', async () => {
    const focusMock = jest.fn()
    const getFieldInstanceMock = jest.fn(() => ({ focus: focusMock }))
    const useFormInstanceSpy = jest.spyOn(Form, 'useFormInstance').mockReturnValue({
      getFieldInstance: getFieldInstanceMock,
    } as any)

    const user = userEvent.setup()
    render(<TestHost />)

    await user.type(screen.getByPlaceholderText('Enter field name'), 'userExtra')
    await user.click(screen.getByTestId('plus-icon').closest('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(getFieldInstanceMock).toHaveBeenCalledWith(['spec', 'extra', 'userExtra'])
      expect(focusMock).toHaveBeenCalled()
    })

    useFormInstanceSpy.mockRestore()
  })
})
