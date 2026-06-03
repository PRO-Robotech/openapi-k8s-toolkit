import styled from 'styled-components'
import { resourceBadgeAbbrCss } from 'components/atoms/ResourceBadgeAbbr'

type TCardProps = {
  $mainColor: string
  $bigBorder?: boolean
}

const Card = styled.div<TCardProps>`
  border-radius: 6px;
  padding: 16px 8px;
  border: ${({ $bigBorder }) => ($bigBorder ? 2 : 1)}px solid ${({ $mainColor }) => $mainColor};
  gap: 12px;
  margin-bottom: 16px;
  position: relative;

  &:before {
    position: absolute;
    content: '';
    width: 36px;
    height: ${({ $bigBorder }) => ($bigBorder ? 2 : 1)}px;
    background: ${({ $mainColor }) => $mainColor};
    left: -37px;
    top: 50%; /* halfway down parent */
    transform: translateY(-50%); /* center vertically */
  }

  &:after {
    position: absolute;
    content: '';
    width: ${({ $bigBorder }) => ($bigBorder ? 7 : 6)}px;
    height: ${({ $bigBorder }) => ($bigBorder ? 7 : 6)}px;
    border-radius: 50%;
    background: ${({ $mainColor }) => $mainColor};
    left: ${({ $bigBorder }) => ($bigBorder ? -41 : -39)}px;
    top: 50%;
    transform: translateY(-50%);
  }
`

type TAbbrProps = {
  $bgColor: string
}

const Abbr = styled.span<TAbbrProps>`
  background-color: ${({ $bgColor }) => $bgColor};
  ${resourceBadgeAbbrCss}
`

const TimeStamp = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
`

const Title = styled.div`
  font-weight: 700;
`

const TimesInPeriod = styled.div`
  margin-top: -16px;
`

export const Styled = {
  Card,
  Abbr,
  TimeStamp,
  Title,
  TimesInPeriod,
}
