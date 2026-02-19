import { FC, useState } from 'react'
import { Modal, Upload, Input, Typography, Table, Space } from 'antd'
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import type { TResourceKind } from '../../../types/ActionsDropdown'

type TCreateFromFilesModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (name: string, data: Record<string, string>, binaryData: Record<string, string>) => void
  resourceKind: TResourceKind
  namespace: string
  isLoading: boolean
}

type TFileEntry = {
  uid: string
  originalName: string
  keyName: string
  content: string
  isBinary: boolean
}

const isValidUtf8Text = (bytes: Uint8Array): boolean => {
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    // Check for null bytes which indicate binary content
    return !decoded.includes('\0')
  } catch {
    return false
  }
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export const CreateFromFilesModal: FC<TCreateFromFilesModalProps> = ({
  open,
  onClose,
  onConfirm,
  resourceKind,
  namespace,
  isLoading,
}) => {
  const [resourceName, setResourceName] = useState('')
  const [fileEntries, setFileEntries] = useState<TFileEntry[]>([])

  const handleBeforeUpload = (file: UploadFile) => {
    const reader = new FileReader()
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer
      const bytes = new Uint8Array(buffer)
      const isBinary = !isValidUtf8Text(bytes)

      let content: string
      if (resourceKind === 'Secret') {
        // Secrets: always base64-encode
        content = arrayBufferToBase64(buffer)
      } else if (isBinary) {
        // ConfigMap binaryData: base64-encode
        content = arrayBufferToBase64(buffer)
      } else {
        // ConfigMap data: plain text
        content = new TextDecoder('utf-8').decode(bytes)
      }

      setFileEntries(prev => [
        ...prev,
        {
          uid: file.uid,
          originalName: file.name,
          keyName: file.name,
          content,
          isBinary: resourceKind === 'Secret' ? false : isBinary,
        },
      ])
    }
    reader.readAsArrayBuffer(file as unknown as Blob)
    return false
  }

  const handleRemoveFile = (uid: string) => {
    setFileEntries(prev => prev.filter(e => e.uid !== uid))
  }

  const handleKeyNameChange = (uid: string, newKeyName: string) => {
    setFileEntries(prev => prev.map(e => (e.uid === uid ? { ...e, keyName: newKeyName } : e)))
  }

  const handleConfirm = () => {
    const trimmedResourceName = resourceName.trim()
    const data: Record<string, string> = {}
    const binaryData: Record<string, string> = {}

    fileEntries.forEach(entry => {
      const keyName = entry.keyName.trim()
      if (entry.isBinary) {
        binaryData[keyName] = entry.content
      } else {
        data[keyName] = entry.content
      }
    })

    onConfirm(trimmedResourceName, data, binaryData)
  }

  const handleClose = () => {
    setResourceName('')
    setFileEntries([])
    onClose()
  }

  const hasEmptyKeyNames = fileEntries.some(e => !e.keyName.trim())
  const hasDuplicateKeyNames = new Set(fileEntries.map(e => e.keyName.trim())).size !== fileEntries.length
  const isValid = resourceName.trim() && fileEntries.length > 0 && !hasEmptyKeyNames && !hasDuplicateKeyNames

  const columns = [
    {
      title: 'File',
      dataIndex: 'originalName',
      key: 'originalName',
      width: '35%',
      render: (text: string, record: TFileEntry) => (
        <Space>
          <Typography.Text ellipsis style={{ maxWidth: 150 }}>
            {text}
          </Typography.Text>
          {record.isBinary && <Typography.Text type="secondary">(binary)</Typography.Text>}
        </Space>
      ),
    },
    {
      title: 'Key name',
      dataIndex: 'keyName',
      key: 'keyName',
      render: (_: unknown, record: TFileEntry) => (
        <Input
          size="small"
          value={record.keyName}
          onChange={e => handleKeyNameChange(record.uid, e.target.value)}
          status={!record.keyName.trim() ? 'error' : undefined}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: unknown, record: TFileEntry) => (
        <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} onClick={() => handleRemoveFile(record.uid)} />
      ),
    },
  ]

  return (
    <Modal
      title={`Create ${resourceKind} from files`}
      open={open}
      onOk={handleConfirm}
      onCancel={handleClose}
      okText="Create"
      confirmLoading={isLoading}
      okButtonProps={{ disabled: !isValid }}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Typography.Text strong>Name</Typography.Text>
          <Input
            placeholder={`${resourceKind.toLowerCase()}-name`}
            value={resourceName}
            onChange={e => setResourceName(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <Typography.Text strong>Namespace</Typography.Text>
          <Input value={namespace} disabled style={{ marginTop: 4 }} />
        </div>

        <Upload.Dragger multiple beforeUpload={handleBeforeUpload} showUploadList={false}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to add</p>
        </Upload.Dragger>

        {fileEntries.length > 0 && (
          <Table
            dataSource={fileEntries}
            columns={columns}
            rowKey="uid"
            size="small"
            pagination={false}
            scroll={{ y: 300 }}
          />
        )}

        {hasDuplicateKeyNames && <Typography.Text type="danger">Key names must be unique.</Typography.Text>}
      </Space>
    </Modal>
  )
}
