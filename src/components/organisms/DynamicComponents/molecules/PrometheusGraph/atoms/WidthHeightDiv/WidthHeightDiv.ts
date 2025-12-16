import { CSSProperties } from 'react'
import styled from 'styled-components'

type TWidthHeightDivProps = {
  $width?: CSSProperties['width']
  $height?: CSSProperties['height']
}

export const WidthHeightDiv = styled.div<TWidthHeightDivProps>`
  width: ${({ $width = 'auto' }) => $width};
  height: ${({ $height = 'auto' }) => $height};
`
