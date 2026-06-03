import styled from 'styled-components'
import { resourceBadgeAbbrCss } from 'components/atoms/ResourceBadgeAbbr'

type TRoundSpanProps = {
  $bgColor?: string
}

const RoundSpan = styled.span<TRoundSpanProps>`
  background-color: ${({ $bgColor }) => $bgColor || 'none'};
  ${resourceBadgeAbbrCss}
`

export const Styled = {
  RoundSpan,
}
