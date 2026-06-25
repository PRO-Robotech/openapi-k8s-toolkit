import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FactoryConfigContextProvider, useFactoryConfig } from './factoryConfigProvider'

const Consumer = () => {
  const config = useFactoryConfig()

  return (
    <div
      data-testid="consumer"
      data-profile={config.nodeTerminalDefaultProfile ?? ''}
      data-namespace-label={config.namespaceLabels?.label ?? ''}
    />
  )
}

describe('factoryConfigProvider module', () => {
  test('returns an empty config outside a provider', () => {
    render(<Consumer />)

    expect(screen.getByTestId('consumer')).toHaveAttribute('data-profile', '')
    expect(screen.getByTestId('consumer')).toHaveAttribute('data-namespace-label', '')
  })

  test('provides terminal profile and namespace labels', () => {
    render(
      <FactoryConfigContextProvider value={{ nodeTerminalDefaultProfile: 'x', namespaceLabels: { label: 'Project' } }}>
        <Consumer />
      </FactoryConfigContextProvider>,
    )

    expect(screen.getByTestId('consumer')).toHaveAttribute('data-profile', 'x')
    expect(screen.getByTestId('consumer')).toHaveAttribute('data-namespace-label', 'Project')
  })
})
