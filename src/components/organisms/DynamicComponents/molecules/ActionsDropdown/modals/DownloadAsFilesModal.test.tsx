/* eslint-disable global-require */
/* eslint-disable react/button-has-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, screen } from '@testing-library/react'
import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { DownloadAsFilesModal } from './DownloadAsFilesModal'

jest.mock('hooks/useDirectUnknownResource')
jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  const React = require('react')

  const Modal = ({ open, title, children, onOk, onCancel, okText = 'OK', okButtonProps }: any) => {
    if (!open) return null
    return React.createElement(
      'div',
      {},
      React.createElement('h2', {}, title),
      children,
      React.createElement('button', { onClick: onCancel }, 'Cancel'),
      React.createElement('button', { onClick: onOk, disabled: Boolean(okButtonProps?.disabled) }, okText),
    )
  }

  return {
    ...actual,
    Modal,
  }
})

const mockUseDirectUnknownResource = useDirectUnknownResource as unknown as jest.Mock

describe('DownloadAsFilesModal', () => {
  const createObjectURLMock = jest.fn(() => 'blob:mock')
  const revokeObjectURLMock = jest.fn()
  let clickSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDirectUnknownResource.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
    })

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLMock,
    })
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  it('downloads selected Secret data entry and closes modal', () => {
    const onClose = jest.fn()
    mockUseDirectUnknownResource.mockReturnValue({
      data: {
        data: {
          'tls.crt': btoa('CERT'),
        },
      },
      isLoading: false,
      isError: false,
      error: undefined,
    })

    render(
      <DownloadAsFilesModal
        open
        onClose={onClose}
        endpoint="/api/clusters/default/k8s/api/v1/namespaces/default/secrets/my-secret"
        resourceKind="Secret"
        name="my-secret"
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'tls.crt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
