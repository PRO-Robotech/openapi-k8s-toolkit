import React, { FC } from 'react'
import { Tooltip } from 'antd'
import { Styled } from './styled'

type TExampleTooltipIconProps = {
  tooltip: string
}

export const ExampleTooltipIcon: FC<TExampleTooltipIconProps> = ({ tooltip }) => {
  return (
    <Tooltip title={tooltip}>
      <Styled.BulbIcon />
    </Tooltip>
  )
}
