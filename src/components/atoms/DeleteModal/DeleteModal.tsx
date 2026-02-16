import React, { FC, useState } from 'react'
import { Modal, Alert } from 'antd'
import { deleteEntry } from 'api/forms'
import { TRequestError } from 'localTypes/api'

export type TDeleteModalProps = {
  name: string
  onClose: () => void
  endpoint: string
}

export const DeleteModal: FC<TDeleteModalProps> = ({ name, onClose, endpoint }) => {
  const [error, setError] = useState<TRequestError | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const onDelete = () => {
    setIsLoading(true)
    setError(undefined)
    deleteEntry({ endpoint })
      .then(() => {
        setIsLoading(false)
        setError(undefined)
        onClose()
      })
      .catch(error => {
        setIsLoading(false)
        setError(error)
      })
  }

  return (
    <Modal
      title={`Delete «${name}»`}
      open
      onOk={() => onDelete()}
      onCancel={() => {
        onClose()
        setIsLoading(false)
        setError(undefined)
      }}
      okText="Delete"
      confirmLoading={isLoading}
      okButtonProps={{ danger: true }}
      width={400}
      centered
    >
      {error && <Alert type="error" message="Error while delete" description={error?.response?.data?.message} />}
    </Modal>
  )
}
