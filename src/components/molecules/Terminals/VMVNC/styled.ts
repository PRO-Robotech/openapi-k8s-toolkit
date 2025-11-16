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

type TFullWidthDivProps = {
  $substractHeight: number
}

const FullWidthDiv = styled.div<TFullWidthDivProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  overflow: hidden;
  background-color: #000000;
  min-width: 0; /* Allow flex item to shrink */
  transition: margin-right 0.3s ease;
`

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  min-width: 0; /* Allow flex item to shrink */
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #ffffff;
`

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #ffffff;
`

export const Styled = {
  Container,
  FullWidthDiv,
  CustomCard,
  StatusBar,
  LoadingContainer,
  ErrorContainer,
  ContentWrapper,
  StatusDivider,
}

