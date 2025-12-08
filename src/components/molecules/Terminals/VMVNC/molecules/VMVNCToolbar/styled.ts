import styled from 'styled-components'

const ShowCursorDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 200px;
`

const ScalingModeContainer = styled.div`
  min-width: 200px;
`
const ScalingModeTitle = styled.div`
  margin-bottom: 8px;
  font-weight: 500;
`

const StatusBar = styled.div`
  background-color: #2d2d2d;
  color: #ffffff;
  padding: 8px 16px;
  font-size: 12px;
  border-bottom: 1px solid #3d3d3d;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  z-index: 10;
  flex-wrap: wrap;
  gap: 4px;
`

const StatusDivider = styled.span`
  color: #666666;
  margin: 0 8px;
  user-select: none;
`

export const Styled = {
  ShowCursorDiv,
  ScalingModeContainer,
  ScalingModeTitle,
  StatusBar,
  StatusDivider,
}
