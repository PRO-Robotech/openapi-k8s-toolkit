import styled from 'styled-components'

const FullWidthDiv = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`

type TCustomCardProps = {
  $isVisible?: boolean
}

const CustomCard = styled.div<TCustomCardProps>`
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  max-height: calc(100vh - 158px);

  * {
    scrollbar-width: thin;
  }
`

type TVisibilityContainerProps = {
  $isVisible?: boolean
}

const VisibilityContainer = styled.div<TVisibilityContainerProps>`
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
`

export const CursorPointerDiv = styled.div`
  cursor: pointer;
  user-select: none;
`

export const Styled = {
  FullWidthDiv,
  CustomCard,
  VisibilityContainer,
  CursorPointerDiv,
}
