import styled, { css } from 'styled-components'

type TResourceBadgeAbbrProps = {
  $bgColor?: string
}

export const resourceBadgeAbbrCss = css<TResourceBadgeAbbrProps>`
  display: flex;
  height: 22px;
  padding: 0 7px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  border: 1px solid ${({ $bgColor }) => $bgColor || 'transparent'};
  font-family: 'SF Pro', sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  text-transform: uppercase;
  letter-spacing: 0;
  box-sizing: border-box;
  flex-shrink: 0;
`

export const ResourceBadgeAbbr = styled.span<TResourceBadgeAbbrProps>`
  background-color: ${({ $bgColor }) => $bgColor || 'none'};
  ${resourceBadgeAbbrCss}
`
