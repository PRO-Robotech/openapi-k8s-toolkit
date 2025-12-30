import styled from 'styled-components'

type TContainerProps = {
  $substractHeight: number
}

const Container = styled.div<TContainerProps>`
  height: calc(100vh - ${({ $substractHeight }) => $substractHeight}px);
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  position: relative;

  * {
    scrollbar-width: thin;
  }
`

type TCustomCardProps = {
  $isVisible?: boolean
  $substractHeight: number
}

const CustomCard = styled.div<TCustomCardProps>`
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  position: relative;

  * {
    scrollbar-width: thin;
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  min-width: 0; /* Allow flex item to shrink */
`

type TFullWidthDivProps = {
  $substractHeight: number
}

const FullWidthDiv = styled.div<TFullWidthDivProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  overflow: hidden;
  background-color: black;
  min-width: 0; /* Allow flex item to shrink */
  transition: margin-right 0.3s ease;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
`

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
`

export const Styled = {
  Container,
  CustomCard,
  ContentWrapper,
  FullWidthDiv,
  LoadingContainer,
  ErrorContainer,
}
