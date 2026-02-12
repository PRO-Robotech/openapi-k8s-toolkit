import { FC, useEffect, useState } from 'react'
import { Modal, InputNumber, Typography } from 'antd'

export type TScaleModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (replicas: number) => void
  currentReplicas: number
  name: string
  isLoading: boolean
}

export const ScaleModal: FC<TScaleModalProps> = ({ open, onClose, onConfirm, currentReplicas, name, isLoading }) => {
  const [replicas, setReplicas] = useState<number | null>(currentReplicas)

  useEffect(() => {
    if (open) {
      setReplicas(currentReplicas)
    }
  }, [open, currentReplicas])

  const isValidReplicas = Number.isInteger(replicas) && (replicas ?? -1) >= 0

  return (
    <Modal
      title={`Scale \u00AB${name}\u00BB`}
      open={open}
      onOk={() => {
        if (isValidReplicas) {
          onConfirm(replicas as number)
        }
      }}
      onCancel={onClose}
      okText="Scale"
      confirmLoading={isLoading}
      okButtonProps={{ disabled: !isValidReplicas }}
      width={400}
    >
      <Typography.Paragraph>
        Current replicas: <strong>{currentReplicas}</strong>
      </Typography.Paragraph>
      <Typography.Paragraph>New replicas:</Typography.Paragraph>
      <InputNumber
        min={0}
        precision={0}
        step={1}
        value={replicas}
        parser={value => Number(value ? value.replace(/[^\d]/g, '') : 0)}
        onChange={value => setReplicas(typeof value === 'number' ? value : null)}
        style={{ width: '100%' }}
        autoFocus
      />
    </Modal>
  )
}
