import styled from 'styled-components'

type TColorContainerProps = {
  $colorText: string
}

const ColorContainer = styled.div<TColorContainerProps>`
  color: ${({ $colorText }) => $colorText};

  & tr,
  td {
    color: ${({ $colorText }) => $colorText};
  }
`

export const Styled = {
  ColorContainer,
}
