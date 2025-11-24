import styled from 'styled-components'

type TCursorDefaultDivProps = {
  $default?: boolean
}

export const CursorDefaultDiv = styled.div<TCursorDefaultDivProps>`
  cursor: ${({ $default }) => ($default ? 'default' : 'inherit')};
`
