import styled from 'styled-components'

type TLoadingContainerProps = {
  $minHeight?: number
}

const LoadingContainer = styled.div<TLoadingContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${({ $minHeight }) => ($minHeight ? `${$minHeight}px` : 'auto')};
`

export const Styled = {
  LoadingContainer,
}
