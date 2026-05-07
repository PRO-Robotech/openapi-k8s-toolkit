import styled from 'styled-components'

type TLoadingContainerProps = {
  $minHeight?: number | string
}

const getMinHeight = (minHeight?: number | string) => {
  if (typeof minHeight === 'number') {
    return `${minHeight}px`
  }

  return minHeight || 'auto'
}

const LoadingContainer = styled.div<TLoadingContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${({ $minHeight }) => getMinHeight($minHeight)};
`

export const Styled = {
  LoadingContainer,
}
