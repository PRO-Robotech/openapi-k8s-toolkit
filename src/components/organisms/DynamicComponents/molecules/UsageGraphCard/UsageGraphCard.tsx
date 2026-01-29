/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Tooltip } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ComposedChart, Line, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { buildPrometheusRangeParams } from '../PrometheusGraph/utils/buildPrometheusRangeParams'
import { matrixToLineSingle, TChartPoint } from '../PrometheusGraph/utils/matrixAdapter/toLine'
import { TPrometheusRangeResponse } from '../PrometheusGraph/types'
import { TUsageGraphCardProps, TUsageGraphCardDatum } from '../../types/UsageGraphCard'
import { parseAll } from '../utils'
import { RequestedMarkerSvg, UsedMarkerSvg, LimitMarkerSvg } from './atoms'
import { getDefaultQuery, clampPercent } from './utils'
import { DEFAULT_SERIES } from './constants'
import { Styled } from './styled'

export const UsageGraphCard: FC<{ data: TUsageGraphCardProps; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const {
    title = 'CPU, core',
    series = [],
    containerStyle,
    /* colors */
    minColor = '#00ae89',
    midColor = '#adad4c',
    maxColor = '#d95a00',
    /* gradient bar */
    requested = 18,
    used = 50,
    limit = 80,
    /* prom */
    baseUrl = 'http://localhost:9090/api/v1/',
    query,
    range = '1h',
    refetchInterval = 30000,
  } = data

  const theme = useTheme()
  const isDark = theme === 'dark'

  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const queryToUse = query ?? getDefaultQuery(title)
  const preparedQuery = queryToUse ? parseAll({ text: queryToUse, replaceValues, multiQueryData }) : undefined
  const preparedBaseUrl = baseUrl ? parseAll({ text: baseUrl, replaceValues, multiQueryData }) : baseUrl
  const preparedRange = range ? parseAll({ text: range, replaceValues, multiQueryData }) : range

  const { data: fetchedSeries = [] } = useQuery<TChartPoint[], Error>({
    queryKey: ['usage-graph', preparedQuery, preparedRange],
    queryFn: async () => {
      if (!preparedQuery) {
        return []
      }
      const { start, end, step } = buildPrometheusRangeParams(preparedRange || '1h')

      const url = `${preparedBaseUrl}query_range?query=${encodeURIComponent(
        preparedQuery,
      )}&start=${start}&end=${end}&step=${step}`

      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`Prometheus request failed: ${res.status}`)
      }

      const json: TPrometheusRangeResponse = await res.json()
      return matrixToLineSingle(json)
    },
    enabled: !!preparedQuery && !isMultiqueryLoading,
    refetchInterval,
  })

  const fetchedSeriesData: TUsageGraphCardDatum[] = fetchedSeries.map(point => ({
    value: point.value,
    label: point.timestamp,
  }))

  const hasSeries = Array.isArray(series) && series.length > 0
  const hasPromSettings = Boolean(queryToUse)
  let seriesToUse = DEFAULT_SERIES

  if (hasSeries) {
    seriesToUse = series
  } else if (hasPromSettings) {
    seriesToUse = fetchedSeriesData
  }

  const chartData = seriesToUse.map((entry, index) => ({
    index,
    value: entry.value,
    label: entry.label,
  }))

  const requestedPercent = clampPercent(requested, limit)
  const usedPercent = clampPercent(used, limit)

  const limitPercent = 90

  const gradientMidStop = `${requestedPercent.toFixed(2)}%`

  const tooltipTitle = (
    <Styled.TooltipContent $isDark={isDark}>
      <Styled.TooltipRow $isDark={isDark}>
        <Styled.TooltipDot $color="#5EDBBD" />
        Requested
      </Styled.TooltipRow>
      <Styled.TooltipRow $isDark={isDark}>
        <Styled.TooltipDot $color="#FF1C1C" />
        Used
      </Styled.TooltipRow>
      <Styled.TooltipRow $isDark={isDark}>
        <Styled.TooltipDot $color="#FD9125" />
        Limit
      </Styled.TooltipRow>
    </Styled.TooltipContent>
  )

  return (
    <Styled.Wrapper style={containerStyle} $isDark={isDark}>
      <Styled.Header>
        <Styled.Title $isDark={isDark}>{title}</Styled.Title>
      </Styled.Header>
      <Styled.ChartContainer>
        <Styled.ChartWrapper>
          <Styled.ChartInner>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <XAxis dataKey="index" hide />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="none"
                  fill={isDark ? 'rgba(120, 140, 175, 0.18)' : 'rgba(207, 220, 248, 0.28)'}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isDark ? 'rgba(150, 170, 205, 0.7)' : '#cfdcf8'}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Styled.ChartInner>
        </Styled.ChartWrapper>
        <Styled.ChartOverlay $isDark={isDark} />
      </Styled.ChartContainer>
      <Styled.GradientBarWrapper>
        <Styled.GradientBarContainer>
          <Tooltip
            title={tooltipTitle}
            placement="bottom"
            color={isDark ? '#1f2937' : '#dbeafe'}
            styles={{
              root: { marginTop: '-35px' },
              body: { padding: 0, borderRadius: 6 },
            }}
          >
            <Styled.GradientBar
              $minColor={minColor}
              $midColor={midColor}
              $maxColor={maxColor}
              style={{ ['--gradient-mid-stop' as string]: gradientMidStop }}
            />
          </Tooltip>
          <Styled.BarMarker $left={requestedPercent}>
            <RequestedMarkerSvg />
          </Styled.BarMarker>
          <Styled.BarMarker $left={usedPercent} $flipX $paddingTop={10}>
            <UsedMarkerSvg />
          </Styled.BarMarker>
          <Styled.BarMarker $left={limitPercent}>
            <LimitMarkerSvg />
          </Styled.BarMarker>
          <Styled.UsedBadge $left={usedPercent} $isDark={isDark}>{`${used} used`}</Styled.UsedBadge>
          <Styled.MarkerLabel $left={requestedPercent} $isDark={isDark}>
            <span>{requested}</span>
            <span>requested</span>
          </Styled.MarkerLabel>
          <Styled.MarkerLabel $left={limitPercent} $isDark={isDark}>
            <span>{limit}</span>
            <span>limit</span>
          </Styled.MarkerLabel>
        </Styled.GradientBarContainer>
      </Styled.GradientBarWrapper>
      {children}
    </Styled.Wrapper>
  )
}
