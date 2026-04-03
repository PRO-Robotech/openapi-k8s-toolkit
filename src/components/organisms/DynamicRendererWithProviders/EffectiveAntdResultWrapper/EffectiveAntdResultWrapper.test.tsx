/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { EffectiveAntdResultWrapper } from './EffectiveAntdResultWrapper'

// Mock AntdResult to verify props are passed correctly
const AntdResultMock = jest.fn(({ data, children }: any) => (
  <div data-testid="antd-result" data-id={data.id} data-req-index={JSON.stringify(data.reqIndex)}>
    {children}
  </div>
))

jest.mock('components/organisms/DynamicComponents/molecules/AntdResult', () => ({
  AntdResult: (props: any) => AntdResultMock(props),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('EffectiveAntdResultWrapper', () => {
  it('passes effectiveReqIndexes as reqIndex array to AntdResult', () => {
    render(
      <EffectiveAntdResultWrapper effectiveReqIndexes={[0, 1, 2]}>
        <div data-testid="child">Content</div>
      </EffectiveAntdResultWrapper>,
    )

    const result = screen.getByTestId('antd-result')
    expect(result).toHaveAttribute('data-req-index', JSON.stringify([0, 1, 2]))
    expect(result).toHaveAttribute('data-id', 'effective-antd-result')
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('passes children through to AntdResult', () => {
    render(
      <EffectiveAntdResultWrapper effectiveReqIndexes={[0]}>
        <div data-testid="page-content">Page content here</div>
      </EffectiveAntdResultWrapper>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('calls AntdResult with correct data shape', () => {
    render(
      <EffectiveAntdResultWrapper effectiveReqIndexes={[0, 3]}>
        <div>Content</div>
      </EffectiveAntdResultWrapper>,
    )

    expect(AntdResultMock).toHaveBeenCalledTimes(1)
    expect(AntdResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { id: 'effective-antd-result', reqIndex: [0, 3] },
      }),
    )
  })
})
