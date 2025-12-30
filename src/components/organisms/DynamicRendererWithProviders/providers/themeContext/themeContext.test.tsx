import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { ThemeProvider, useTheme } from './themeContext'

const Consumer = () => {
  const theme = useTheme()
  return <div data-testid="theme">{theme}</div>
}

describe('ThemeProvider / useTheme', () => {
  test('defaults to dark when no provider is used', () => {
    render(<Consumer />)
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  test('provides light theme', () => {
    render(
      <ThemeProvider theme="light">
        <Consumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  test('provides dark theme', () => {
    render(
      <ThemeProvider theme="dark">
        <Consumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  test('updates when provider theme changes', () => {
    const { rerender } = render(
      <ThemeProvider theme="dark">
        <Consumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    rerender(
      <ThemeProvider theme="light">
        <Consumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })
})
