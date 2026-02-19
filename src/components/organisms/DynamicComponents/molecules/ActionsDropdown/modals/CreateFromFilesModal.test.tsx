import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CreateFromFilesModal } from './CreateFromFilesModal'

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

  const Dragger = ({ beforeUpload, multiple }: any) =>
    React.createElement('input', {
      type: 'file',
      'data-testid': 'upload-input',
      multiple,
      onChange: (event: Event) => {
        const files = Array.from(((event.target as HTMLInputElement).files ?? []) as File[])
        files.forEach((file, index) => {
          const fileLike = {
            uid: String(index),
            name: file.name,
            arrayBuffer: async () => Uint8Array.from([118, 97, 108, 117, 101, 61, 49]).buffer,
          }
          beforeUpload(fileLike)
        })
      },
    })

  return {
    ...actual,
    Modal,
    Upload: {
      ...actual.Upload,
      Dragger,
    },
    Table: () => null,
  }
})

class MockFileReader {
  result: ArrayBuffer | string | null = null

  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null

  readAsArrayBuffer(file: Blob) {
    file.arrayBuffer().then(buffer => {
      this.result = buffer
      this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>)
    })
  }
}

describe('CreateFromFilesModal', () => {
  const realFileReader = global.FileReader

  beforeAll(() => {
    ;(global as unknown as { FileReader: typeof FileReader }).FileReader = MockFileReader as unknown as typeof FileReader
  })

  afterAll(() => {
    ;(global as unknown as { FileReader: typeof FileReader }).FileReader = realFileReader
  })

  it('trims resource name and key names before submit', async () => {
    const onConfirm = jest.fn()
    render(
      <CreateFromFilesModal
        open
        onClose={jest.fn()}
        onConfirm={onConfirm}
        resourceKind="ConfigMap"
        namespace="default"
        isLoading={false}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('configmap-name'), { target: { value: '  my-config  ' } })

    const file = new File(['value=1'], '  app.conf  ', { type: 'text/plain' })
    fireEvent.change(screen.getByTestId('upload-input'), { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    const [name, data, binaryData] = onConfirm.mock.calls[0]
    expect(name).toBe('my-config')
    expect(new Set([...Object.keys(data), ...Object.keys(binaryData)])).toEqual(new Set(['app.conf']))
  })
})
