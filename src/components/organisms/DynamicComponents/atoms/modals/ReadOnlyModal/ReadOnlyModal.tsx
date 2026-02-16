/* eslint-disable no-console */
/* eslint-disable react/no-unstable-nested-components */
import React, { FC, CSSProperties, PropsWithChildren } from 'react'
import { Modal } from 'antd'
import { Spacer } from 'components/atoms'

type TReadOnlyModalProps = PropsWithChildren<{
  open: boolean
  close: () => void
  modalTitle: string
  modalDescriptionText?: string
  modalDescriptionTextStyle?: CSSProperties
  editModalWidth?: number | string
  paddingContainerEnd?: string
}>

export const ReadOnlyModal: FC<TReadOnlyModalProps> = ({
  open,
  close,
  modalTitle,
  modalDescriptionText,
  modalDescriptionTextStyle,
  editModalWidth,
  children,
}) => {
  return (
    <Modal
      title={modalTitle}
      open={open}
      okButtonProps={{ style: { display: 'none' } }}
      onCancel={() => {
        close()
      }}
      maskClosable={false}
      width={editModalWidth || 520}
      destroyOnHidden
      centered
    >
      {modalDescriptionText && (
        <>
          <div style={modalDescriptionTextStyle}>{modalDescriptionText}</div>
          <Spacer $space={10} $samespace />
        </>
      )}
      {children}
    </Modal>
  )
}
