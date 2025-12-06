/** @jest-environment jsdom */

import React from 'react'
import { render, screen } from '@testing-library/react'
import 'jest-styled-components'
import { ContentCard } from './ContentCard'

// Mock antd theme token hook
jest.mock('antd', () => ({
  theme: {
    useToken: jest.fn(),
  },
}))

const { theme } = jest.requireMock('antd') as {
  theme: { useToken: jest.Mock }
}

describe('ContentCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    theme.useToken.mockReturnValue({
      token: {
        colorBgContainer: 'rgb(1, 2, 3)',
        colorBorder: 'rgb(4, 5, 6)',
      },
    })
  })

  const getContainer = () => {
    const child = screen.getByTestId('child')
    const container = child.parentElement as HTMLElement
    expect(container).toBeTruthy()
    return container
  }

  test('renders children', () => {
    render(
      <ContentCard>
        <span data-testid="child">Hello</span>
      </ContentCard>,
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  test('uses token colors for background and border', () => {
    render(
      <ContentCard>
        <span data-testid="child">Hello</span>
      </ContentCard>,
    )

    const container = getContainer()

    expect(container).toHaveStyleRule('background-color', 'rgb(1, 2, 3)')
    expect(container).toHaveStyleRule('border', '1px solid rgb(4, 5, 6)')
  })

  test('defaults to block display and 100% height when props not provided', () => {
    render(
      <ContentCard>
        <span data-testid="child">Hello</span>
      </ContentCard>,
    )

    const container = getContainer()

    expect(container).toHaveStyleRule('display', 'block')
    expect(container).toHaveStyleRule('height', '100%')
  })

  test('applies displayFlex = true', () => {
    render(
      <ContentCard displayFlex>
        <span data-testid="child">Hello</span>
      </ContentCard>,
    )

    const container = getContainer()
    expect(container).toHaveStyleRule('display', 'flex')
  })

  test('applies flexGrow', () => {
    render(
      <ContentCard flexGrow={2}>
        <span data-testid="child">Hello</span>
      </ContentCard>,
    )

    const container = getContainer()
    expect(container).toHaveStyleRule('flex-grow', '2')
  })

  test('applies flexFlow', () => {
    render(
      <ContentCard displayFlex flexFlow="row wrap">
        <span data-testid="child">Hello</span>
      </ContentCard>,
    )

    const container = getContainer()
    expect(container).toHaveStyleRule('flex-flow', 'row wrap')
  })

  test('applies maxHeight when provided (current implementation uses raw number string)', () => {
    render(
      <ContentCard maxHeight={250}>
        <span data-testid="child">Hello</span>
      </ContentCard>,
    )

    const container = getContainer()
    // NOTE: because the styled template interpolates a number directly,
    // the CSS rule becomes "height: 250;" (string "250").
    expect(container).toHaveStyleRule('height', '250')
  })
})
