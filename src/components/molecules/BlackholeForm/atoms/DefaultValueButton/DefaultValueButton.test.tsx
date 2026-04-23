import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DefaultValueButton } from './DefaultValueButton'

describe('DefaultValueButton', () => {
  describe('apply mode', () => {
    it('renders an apply button', () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)

      expect(screen.getByRole('button', { name: /apply default/i })).toBeInTheDocument()
    })

    it('calls onApply when clicked', () => {
      const onApply = jest.fn()
      const onClear = jest.fn()

      render(<DefaultValueButton defaultValue="TCP" isApplied={false} onApply={onApply} onClear={onClear} />)

      fireEvent.click(screen.getByRole('button', { name: /apply default/i }))

      expect(onApply).toHaveBeenCalledTimes(1)
      expect(onClear).not.toHaveBeenCalled()
    })

    it('does not call onApply when disabled', () => {
      const onApply = jest.fn()

      render(<DefaultValueButton defaultValue="TCP" isApplied={false} onApply={onApply} onClear={jest.fn()} disabled />)

      fireEvent.click(screen.getByRole('button', { name: /apply default/i }))

      expect(onApply).not.toHaveBeenCalled()
    })
  })

  describe('clear mode', () => {
    it('renders a clear button', () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied onApply={jest.fn()} onClear={jest.fn()} />)

      expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument()
    })

    it('calls onClear when clicked', () => {
      const onApply = jest.fn()
      const onClear = jest.fn()

      render(<DefaultValueButton defaultValue="TCP" isApplied onApply={onApply} onClear={onClear} />)

      fireEvent.click(screen.getByRole('button', { name: /^clear$/i }))

      expect(onClear).toHaveBeenCalledTimes(1)
      expect(onApply).not.toHaveBeenCalled()
    })

    it('does not call onClear when disabled', () => {
      const onClear = jest.fn()

      render(<DefaultValueButton defaultValue="TCP" isApplied onApply={jest.fn()} onClear={onClear} disabled />)

      fireEvent.click(screen.getByRole('button', { name: /^clear$/i }))

      expect(onClear).not.toHaveBeenCalled()
    })
  })

  describe('tooltip formatting', () => {
    const getTooltipText = async (label: RegExp): Promise<string> => {
      const button = screen.getByRole('button', { name: label })
      fireEvent.mouseEnter(button)
      const tooltip = await screen.findByRole('tooltip')

      return tooltip.textContent ?? ''
    }

    it('formats a string default', async () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)

      expect(await getTooltipText(/apply default/i)).toMatch(/TCP/)
    })

    it('formats a number default', async () => {
      render(<DefaultValueButton defaultValue={0} isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)

      expect(await getTooltipText(/apply default/i)).toMatch(/\b0\b/)
    })

    it('formats a boolean default', async () => {
      render(<DefaultValueButton defaultValue={false} isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)

      expect(await getTooltipText(/apply default/i)).toMatch(/false/)
    })

    it('formats an array default', async () => {
      render(
        <DefaultValueButton defaultValue={['foo', 'bar']} isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />,
      )

      expect(await getTooltipText(/apply default/i)).toMatch(/foo, bar/)
    })

    it('shows the default value in clear mode too', async () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied onApply={jest.fn()} onClear={jest.fn()} />)

      expect(await getTooltipText(/^clear$/i)).toMatch(/TCP/)
    })
  })
})
