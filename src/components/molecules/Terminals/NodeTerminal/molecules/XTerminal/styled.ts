import styled from 'styled-components'

type TCustomCardProps = {
  $isVisible?: boolean
  $substractHeight: number
}

const CustomCard = styled.div<TCustomCardProps>`
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

type TProgressContainerProps = {
  $substractHeight: number
}

const ProgressContainer = styled.div<TProgressContainerProps>`
  width: 100%;
  height: calc(100vh - ${({ $substractHeight }) => $substractHeight}px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
`

export const Styled = {
  FullWidthDiv,
  CustomCard,
  ProgressContainer,
}
