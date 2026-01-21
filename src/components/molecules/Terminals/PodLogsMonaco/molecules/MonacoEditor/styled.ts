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

const EditorWrapper = styled.div`
  position: relative;
  width: 100%;
`

type TStreamingOverlayProps = {
  $isVisible?: boolean
  $colorBgLayout: string
}

const StreamingOverlay = styled.div<TStreamingOverlayProps>`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: ${({ $colorBgLayout }) => $colorBgLayout};
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
`

export const CursorPointerDiv = styled.div`
  cursor: pointer;
  user-select: none;
`

export const Styled = {
  FullWidthDiv,
  CustomCard,
  EditorWrapper,
  StreamingOverlay,
  CursorPointerDiv,
}
