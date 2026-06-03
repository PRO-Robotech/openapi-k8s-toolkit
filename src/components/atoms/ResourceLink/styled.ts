import styled from 'styled-components'
import { resourceBadgeAbbrCss } from 'components/atoms/ResourceBadgeAbbr'

type TAbbrProps = {
  $bgColor: string
}

const Abbr = styled.span<TAbbrProps>`
  background-color: ${({ $bgColor }) => $bgColor};
  ${resourceBadgeAbbrCss}
`

export const Styled = {
  Abbr,
}
