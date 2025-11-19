import styled from 'styled-components'

type TBorderRadiusContainerProps = {
  $designNewLayoutHeight?: number
  $colorBorder: string
}

const BorderRadiusContainer = styled.div<TBorderRadiusContainerProps>`
  height: ${({ $designNewLayoutHeight }) => ($designNewLayoutHeight ? `${$designNewLayoutHeight}px` : '75vh')};
  border: 1px solid ${({ $colorBorder }) => $colorBorder};
  border-radius: 8px;
  padding: 2px;
  box-sizing: border-box;

  .monaco-editor,
  .overflow-guard {
    border-radius: 8px;
  }
`

type TControlsRowContainerProps = {
  $designNewLayout?: boolean
  $bgColor: string
}

const ControlsRowContainer = styled.div<TControlsRowContainerProps>`
  margin-top: 10px;
  display: flex;
  align-items: center;
  background-color: ${({ $bgColor, $designNewLayout }) => ($designNewLayout ? $bgColor : 'initial')};
  border-radius: 8px;
  padding: 4px;
`

const BigText = styled.div`
  font-size: 16px;
  line-height: 24px;
`

export const Styled = {
  BorderRadiusContainer,
  ControlsRowContainer,
  BigText,
}
