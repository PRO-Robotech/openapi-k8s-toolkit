import styled from 'styled-components'

type TCardProps = {
  $colorBorder: string
  $colorBgContainer: string
  $cursorPointer?: boolean
}

const Card = styled.div<TCardProps>`
  display: flex;
  padding: 16px;
  gap: 24px;
  border-radius: 6px;
  border: 1px solid ${({ $colorBorder }) => $colorBorder};
  background: ${({ $colorBgContainer }) => $colorBgContainer};
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.25);
  cursor: ${({ $cursorPointer }) => ($cursorPointer ? 'pointer' : 'auto')};
`

type TCardTitleProps = {
  $colorTextDescription: string
}

const CardTitle = styled.div<TCardTitleProps>`
  color: ${({ $colorTextDescription }) => $colorTextDescription};
  font-size: 12px;
  line-height: 20px; /* 166.667% */
`

type TCardNumberProps = {
  $colorText: string
}

const CardNumber = styled.div<TCardNumberProps>`
  color: ${({ $colorText }) => $colorText};
  font-size: 16px;
  line-height: 24px; /* 150% */
`

type TCardIconProps = {
  $colorInfo: string
}

const CardIcon = styled.div<TCardIconProps>`
  color: ${({ $colorInfo }) => $colorInfo};
  display: flex;
  width: 40px;
  height: 40px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`

export const Styled = {
  Card,
  CardTitle,
  CardNumber,
  CardIcon,
}
