/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { PartsOfUrlProvider, usePartsOfUrl } from './partsOfUrlContext'

const Consumer = () => {
  const { partsOfUrl } = usePartsOfUrl()
  return (
    <div>
      <div data-testid="len">{String(partsOfUrl.length)}</div>
      <div data-testid="joined">{partsOfUrl.join('/')}</div>
      <div data-testid="json">{JSON.stringify(partsOfUrl)}</div>
    </div>
  )
}

describe('PartsOfUrlProvider / usePartsOfUrl', () => {
  test('provides partsOfUrl to consumers', () => {
    const value = { partsOfUrl: ['a', 'b', 'c'] }

    render(
      <PartsOfUrlProvider {...({ value } as any)}>
        <Consumer />
      </PartsOfUrlProvider>,
    )

    expect(screen.getByTestId('len')).toHaveTextContent('3')
    expect(screen.getByTestId('joined')).toHaveTextContent('a/b/c')
    expect(screen.getByTestId('json')).toHaveTextContent('["a","b","c"]')
  })

  test('usePartsOfUrl throws outside provider', () => {
    const Spy = () => {
      usePartsOfUrl()
      return null
    }

    // Silence React 18 error boundary noise for intentional throw tests
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Spy />)).toThrow()

    consoleErrorSpy.mockRestore()
  })
})
