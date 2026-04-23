import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormBooleanInput } from './FormBooleanInput'
import { useDefaultValueButton } from '../helpers/useDefaultValueButton'

jest.mock('../helpers/useDefaultValueButton', () => ({
  useDefaultValueButton: jest.fn(),
}))

jest.mock('../../organisms/BlackholeForm/context', () => ({
  useDesignNewLayout: () => false,
}))

jest.mock('../../atoms', () => ({
  ResetedFormItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reseted-form-item">{children}</div>
  ),
  CustomSizeTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HiddenContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DefaultValueButton: ({
    isApplied,
    onApply,
    onClear,
  }: {
    isApplied: boolean
    onApply: () => void
    onClear: () => void
  }) => (
    <button type="button" onClick={isApplied ? onClear : onApply}>
      {isApplied ? 'default-clear' : 'apply-default'}
    </button>
  ),
}))

jest.mock('components/atoms', () => ({
  MinusIcon: () => <span data-testid="minus-icon" />,
  BackToDefaultIcon: () => <span data-testid="legacy-clear-icon" />,
}))

const mockedUseDefaultValueButton = jest.mocked(useDefaultValueButton)

const baseProps = {
  name: ['spec', 'enabled'] as (string | number)[],
  removeField: jest.fn(),
  makeValueUndefined: jest.fn(),
}

describe('FormBooleanInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('hides the legacy clear icon when the default button is visible', () => {
    mockedUseDefaultValueButton.mockReturnValue({
      visible: true,
      isApplied: false,
      handleApply: jest.fn(),
      handleClear: jest.fn(),
    })

    render(<FormBooleanInput {...baseProps} defaultValue />)

    expect(screen.getByRole('button', { name: 'apply-default' })).toBeInTheDocument()
    expect(screen.queryByTestId('legacy-clear-icon')).not.toBeInTheDocument()
  })

  it('keeps the legacy clear icon when the default button is hidden', () => {
    mockedUseDefaultValueButton.mockReturnValue({ visible: false })

    render(<FormBooleanInput {...baseProps} />)

    expect(screen.getByTestId('legacy-clear-icon')).toBeInTheDocument()
  })

  it('calls makeValueUndefined through the legacy clear icon when no default button is shown', () => {
    mockedUseDefaultValueButton.mockReturnValue({ visible: false })

    render(<FormBooleanInput {...baseProps} />)

    fireEvent.click(screen.getByTestId('legacy-clear-icon').parentElement as HTMLElement)

    expect(baseProps.makeValueUndefined).toHaveBeenCalledWith(baseProps.name)
  })
})
