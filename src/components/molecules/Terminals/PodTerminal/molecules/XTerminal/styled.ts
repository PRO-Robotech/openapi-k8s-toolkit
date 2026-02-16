import styled from 'styled-components'

type TCustomCardProps = {
  $isVisible?: boolean
  $hasError?: boolean
  $substractHeight: number
}

const CustomCard = styled.div<TCustomCardProps>`
  display: ${({ $hasError }) => ($hasError ? 'none' : 'block')};
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  height: calc(100vh - ${({ $substractHeight }) => $substractHeight}px);

  * {
    scrollbar-width: thin;
  }
`

type TFullWidthDivProps = {
  $substractHeight: number
}

const FullWidthDiv = styled.div<TFullWidthDivProps>`
  display: flex;
  justify-content: center;
  width: 100%;
  height: calc(100vh - ${({ $substractHeight }) => $substractHeight}px);
`

export const Styled = {
  FullWidthDiv,
  CustomCard,
}
