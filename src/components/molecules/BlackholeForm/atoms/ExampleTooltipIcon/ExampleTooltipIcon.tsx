import React, { FC } from 'react'
import { Tooltip } from 'antd'
import { BulbOutlined } from '@ant-design/icons'

type TExampleTooltipIconProps = {
  tooltip: string
}

export const ExampleTooltipIcon: FC<TExampleTooltipIconProps> = ({ tooltip }) => {
  return (
    <Tooltip title={tooltip}>
      <BulbOutlined />
    </Tooltip>
  )
}
