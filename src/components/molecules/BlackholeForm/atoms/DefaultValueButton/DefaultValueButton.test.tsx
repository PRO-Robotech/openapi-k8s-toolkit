import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DefaultValueButton } from './DefaultValueButton'

describe('DefaultValueButton', () => {
  describe('apply mode (isApplied = false)', () => {
    it('renders an "Apply default" button', () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)

      const button = screen.getByRole('button', { name: /apply default/i })
      expect(button).toBeInTheDocument()
    })

    it('does not render a Clear button', () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)

      expect(screen.queryByRole('button', { name: /^clear$/i })).not.toBeInTheDocument()
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

  describe('clear mode (isApplied = true)', () => {
    it('renders a "Clear" button', () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied onApply={jest.fn()} onClear={jest.fn()} />)

      const button = screen.getByRole('button', { name: /^clear$/i })
      expect(button).toBeInTheDocument()
    })

    it('does not render an Apply default button', () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied onApply={jest.fn()} onClear={jest.fn()} />)

      expect(screen.queryByRole('button', { name: /apply default/i })).not.toBeInTheDocument()
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

  describe('value formatting in tooltips', () => {
    /**
     * Ant Design's Tooltip mounts the title text in the DOM lazily — it only
     * appears after a hover. We trigger that hover, then read the rendered
     * tooltip body to assert that the formatted default makes it through.
     */
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

    it('formats a number default (including 0)', async () => {
      render(<DefaultValueButton defaultValue={0} isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)
      expect(await getTooltipText(/apply default/i)).toMatch(/\b0\b/)
    })

    it('formats a boolean default (including false)', async () => {
      render(<DefaultValueButton defaultValue={false} isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />)
      expect(await getTooltipText(/apply default/i)).toMatch(/false/)
    })

    it('formats an array default by joining with ", "', async () => {
      render(
        <DefaultValueButton defaultValue={['foo', 'bar']} isApplied={false} onApply={jest.fn()} onClear={jest.fn()} />,
      )
      expect(await getTooltipText(/apply default/i)).toMatch(/foo, bar/)
    })

    it('shows the default value in the clear-mode tooltip too', async () => {
      render(<DefaultValueButton defaultValue="TCP" isApplied onApply={jest.fn()} onClear={jest.fn()} />)
      expect(await getTooltipText(/^clear$/i)).toMatch(/TCP/)
    })
  })
})
