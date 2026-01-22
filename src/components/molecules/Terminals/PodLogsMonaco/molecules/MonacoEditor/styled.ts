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

type TStreamingBarProps = {
  $isVisible?: boolean
  $isDark?: boolean
}

const StreamingBar = styled.div<TStreamingBarProps>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: ${({ $isDark }) => ($isDark ? '#1e1e1e' : '#fffffe')};
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
  StreamingBar,
  CursorPointerDiv,
}
