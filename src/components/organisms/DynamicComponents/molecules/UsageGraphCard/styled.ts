import styled from 'styled-components'

type TThemeProps = {
  $isDark?: boolean
}

const TooltipContent = styled.div<TThemeProps>`
  background: ${({ $isDark }) => ($isDark ? '#1f2937' : '#dbeafe')};
  border-radius: 6px;
  padding: 6px 8px;
  box-shadow:
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 6px 16px 0 rgba(0, 0, 0, 0.08);
`

const TooltipRow = styled.div<TThemeProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  line-height: 20px;
  color: ${({ $isDark }) => ($isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)')};
  white-space: nowrap;
`

type TTooltipDotProps = {
  $color: string
}

const TooltipDot = styled.span<TTooltipDotProps>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-block;
`

const Wrapper = styled.div<TThemeProps>`
  background: ${({ $isDark }) => ($isDark ? '#2a2f3a' : '#ffffff')};
  border: 1px solid ${({ $isDark }) => ($isDark ? '#485263' : '#cbd5e1')};
  border-radius: 6px;
  box-sizing: border-box;
  padding: 4px 0 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(0.45px);
`

const Header = styled.div`
  width: 100%;
  padding: 4px 8px;
  box-sizing: border-box;
`

const Title = styled.div<TThemeProps>`
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: ${({ $isDark }) => ($isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)')};
`

const ChartContainer = styled.div`
  width: 100%;
  max-width: 394px;
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
`

const ChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
`

const ChartInner = styled.div`
  width: 100%;
  height: 80px;
`

const ChartOverlay = styled.div<TThemeProps>`
  position: absolute;
  inset: 0;
  border-radius: 10px;
  pointer-events: none;
  z-index: 2;
  box-shadow: ${({ $isDark }) =>
    $isDark
      ? 'inset 18px 0 18px 2px rgba(42, 47, 58, 0.7), inset -18px 0 18px 4px rgba(42, 47, 58, 0.7), inset 0 -18px 18px 7px rgba(42, 47, 58, 0.7)'
      : 'inset 18px 0 18px 2px rgba(255, 255, 255, 0.95), inset -18px 0 18px 4px rgba(255, 255, 255, 0.95), inset 0 -18px 18px 7px rgba(255, 255, 255, 0.95)'};
`

type TGradientBarProps = {
  $minColor: string
  $midColor: string
  $maxColor: string
}

const GradientBar = styled.div<TGradientBarProps>`
  position: absolute;
  top: var(--bar-top);
  left: 0;
  width: 100%;
  height: 22px;
  border-radius: 22px;
  background: linear-gradient(
    90deg,
    ${({ $minColor }) => $minColor} 0%,
    ${({ $midColor }) => $midColor} var(--gradient-mid-stop, 50%),
    ${({ $maxColor }) => $maxColor} 100%
  );
`

const GradientBarWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 12px;
`

const GradientBarContainer = styled.div`
  width: 100%;
  max-width: 332px;
  position: relative;
  height: 72px;

  --bar-top: 18px;
  --bar-height: 22px;
  --marker-height: 36px;
`

type TBarMarkerProps = {
  $left: number
  $flip?: boolean
  $flipX?: boolean
  $paddingTop?: number
}

const BarMarker = styled.div<TBarMarkerProps>`
  position: absolute;
  padding-top: ${({ $paddingTop }) => $paddingTop ?? 15}px;
  left: ${({ $left }) => $left}%;
  top: calc(var(--bar-top) + (var(--bar-height) / 2) - (var(--marker-height) / 2) + 50);
  width: 10px;
  height: var(--marker-height);
  transform: translateX(-50%) ${({ $flip, $flipX }) => `${$flip ? ' scaleY(-1)' : ''}${$flipX ? ' scaleX(-1)' : ''}`};
  z-index: 2;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
`

type TMarkerLabelProps = {
  $left: number
  $isDark?: boolean
}
const MarkerLabel = styled.div<TMarkerLabelProps>`
  position: absolute;
  top: calc(var(--bar-top) + var(--bar-height) + 10px);
  left: ${({ $left }) => $left}%;
  transform: translateX(-50%);
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  line-height: 16px;
  color: ${({ $isDark }) => ($isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)')};
  white-space: nowrap;
  text-align: center;

  span {
    display: block;
  }
`

type TUsedBadgeProps = {
  $left: number
  $isDark?: boolean
}

const UsedBadge = styled.div<TUsedBadgeProps>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: -58px;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: ${({ $isDark }) => ($isDark ? '#2a2f3a' : '#ffffff')};
  border: 1px solid ${({ $isDark }) => ($isDark ? '#485263' : '#cbd5e1')};
  border-radius: 8px;
  box-shadow:
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 6px 16px 0 rgba(0, 0, 0, 0.08);
  font-family: 'Roboto', sans-serif;
  font-size: 24px;
  line-height: 32px;
  color: ${({ $isDark }) => ($isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)')};
  white-space: nowrap;
  z-index: 3;
`

export const Styled = {
  TooltipContent,
  TooltipRow,
  TooltipDot,
  Wrapper,
  Header,
  Title,
  ChartContainer,
  ChartWrapper,
  ChartInner,
  ChartOverlay,
  GradientBar,
  GradientBarWrapper,
  GradientBarContainer,
  BarMarker,
  MarkerLabel,
  UsedBadge,
}
