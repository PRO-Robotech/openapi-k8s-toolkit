import styled from 'styled-components'
import { Button } from 'antd'

const IconWrapper = styled.span`
  display: inline-flex;
  width: 14px;
  height: 14px;
  align-items: center;
  justify-content: center;
`

const IconScaler = styled.span`
  display: inline-flex;
  transform: scale(0.58);
`

const IconButton = styled(Button)`
  height: 24px;

  .anticon {
    font-size: 16px;
  }
`

export const Styled = {
  IconWrapper,
  IconScaler,
  IconButton,
}
