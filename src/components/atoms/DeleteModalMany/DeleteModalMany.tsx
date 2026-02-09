import React, { FC, useState } from 'react'
import { Modal, Alert } from 'antd'
import { deleteEntry } from 'api/forms'
import { TRequestError } from 'localTypes/api'

export type TDeleteModalManyProps = {
  onClose: () => void
  data: { name: string; endpoint: string }[]
}

export const DeleteModalMany: FC<TDeleteModalManyProps> = ({ data, onClose }) => {
  const [error, setError] = useState<TRequestError | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const onDelete = () => {
    setIsLoading(true)
    setError(undefined)

    const promises = data.map(({ endpoint }) => deleteEntry({ endpoint }))

    Promise.all(promises)
      .then(() => {
        onClose()
        setIsLoading(false)
        setError(undefined)
      })
      .catch(error => {
        setIsLoading(false)
        setError(error)
      })
  }

  return (
    <Modal
      title="Delete selected"
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
