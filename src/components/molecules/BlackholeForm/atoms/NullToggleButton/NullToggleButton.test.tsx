import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NullToggleButton } from './NullToggleButton'

describe('NullToggleButton', () => {
  it('renders "Set null" when value is not null and calls onSetNull on click', () => {
    const onSetNull = jest.fn()
    const onClear = jest.fn()

    render(<NullToggleButton isNull={false} onSetNull={onSetNull} onClear={onClear} />)

    const button = screen.getByRole('button', { name: 'Set null' })
    fireEvent.click(button)

    expect(onSetNull).toHaveBeenCalledTimes(1)
    expect(onClear).not.toHaveBeenCalled()
  })

  it('renders "Clear null" when value is null and calls onClear on click', () => {
    const onSetNull = jest.fn()
    const onClear = jest.fn()

    render(<NullToggleButton isNull onSetNull={onSetNull} onClear={onClear} />)

    const button = screen.getByRole('button', { name: 'Clear null' })
    fireEvent.click(button)

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onSetNull).not.toHaveBeenCalled()
  })

  it('respects the disabled prop', () => {
    render(<NullToggleButton isNull={false} onSetNull={jest.fn()} onClear={jest.fn()} disabled />)

    expect(screen.getByRole('button', { name: 'Set null' })).toBeDisabled()
  })
})
