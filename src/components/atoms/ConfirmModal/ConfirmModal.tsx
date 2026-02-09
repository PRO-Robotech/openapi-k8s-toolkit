import React, { FC, ReactNode } from 'react'
import { Modal } from 'antd'

export type TConfirmModalProps = {
  title: string
  onConfirm: () => void
  onClose: () => void
  confirmText?: string
  cancelText?: string
  confirmLoading?: boolean
  danger?: boolean
  width?: number
  children?: ReactNode
}

export const ConfirmModal: FC<TConfirmModalProps> = ({
  title,
  onConfirm,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
  danger = false,
  width = 400,
  children,
}) => {
  return (
    <Modal
      title={title}
      open
      onOk={() => onConfirm()}
      onCancel={() => onClose()}
      okText={confirmText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      okButtonProps={{ danger }}
      width={width}
      centered
    >
      {children}
    </Modal>
  )
}
