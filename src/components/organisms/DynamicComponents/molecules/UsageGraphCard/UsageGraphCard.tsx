/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Tooltip, theme as antdtheme } from 'antd'
import { ComposedChart, Line, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { usePromMatrixToLineSingle } from '../PrometheusGraph/hooks/queryRangeMatrix/single/usePromMatrixToLineSingle'
import { usePromVector } from '../PrometheusGraph/hooks/queryVector/usePromVector'
import { TPrometheusVectorResponse } from '../PrometheusGraph/types'
import { TUsageGraphCardProps, TUsageGraphCardDatum } from '../../types/UsageGraphCard'
import { parsePromTemplate } from '../utils'
import { RequestedMarkerSvg, UsedMarkerSvg, LimitMarkerSvg, FormattedValue } from './atoms'
import { getDefaultQuery, clampPercent } from './utils'
import { DEFAULT_SERIES } from './constants'
import { Styled } from './styled'

export const UsageGraphCard: FC<{ data: TUsageGraphCardProps; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const badgesContainerRef = useRef<HTMLDivElement | null>(null)
  const usedBadgeRef = useRef<HTMLDivElement | null>(null)
  const requestedLabelRef = useRef<HTMLDivElement | null>(null)
  const limitLabelRef = useRef<HTMLDivElement | null>(null)
  const [clampedUsedPercent, setClampedUsedPercent] = useState<number | null>(null)
  const [clampedRequestedPercent, setClampedRequestedPercent] = useState<number | null>(null)

  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const { token } = antdtheme.useToken()

  const {
    title = 'CPU, core',
    series = [],
    containerStyle,
    valueStrategy,
    valuePrecision = 2,
    hideUnit = true,
    /* colors */
    minColor = '#00ae89',
    midColor = '#adad4c',
    maxColor = '#d95a00',
    /* gradient bar */
    requested,
    requestedQuery,
    used,
    usedQuery,
    limit,
    limitQuery,
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
  const preparedQuery = queryToUse ? parsePromTemplate({ text: queryToUse, replaceValues, multiQueryData }) : undefined
  const preparedBaseUrl = baseUrl ? parsePromTemplate({ text: baseUrl, replaceValues, multiQueryData }) : baseUrl
  const preparedRange = range ? parsePromTemplate({ text: range, replaceValues, multiQueryData }) : range
  const preparedRequestedQuery = requestedQuery
    ? parsePromTemplate({ text: requestedQuery, replaceValues, multiQueryData })
    : undefined
  const preparedUsedQuery = usedQuery
    ? parsePromTemplate({ text: usedQuery, replaceValues, multiQueryData })
    : preparedQuery
  const preparedLimitQuery = limitQuery
    ? parsePromTemplate({ text: limitQuery, replaceValues, multiQueryData })
    : undefined

  const { data: fetchedSeries = [] } = usePromMatrixToLineSingle({
    baseUrl: preparedBaseUrl,
    query: preparedQuery ?? '',
    range: preparedRange || '1h',
    enabled: !!preparedQuery && !isMultiqueryLoading,
    refetchInterval,
  })

  const resolveVectorValue = (response?: TPrometheusVectorResponse) => {
    if (!response || response.status !== 'success') {
      return undefined
    }

    const total = (response.data.result || []).reduce((acc, item) => {
      const value = Number(item.value?.[1])
      return Number.isFinite(value) ? acc + value : acc
    }, 0)

    return Number.isFinite(total) ? total : undefined
  }

  const shouldFetchRequested = requested === undefined && Boolean(preparedRequestedQuery)
  const shouldFetchCurrent = used === undefined && Boolean(preparedUsedQuery)
  const shouldFetchLimit = limit === undefined && Boolean(preparedLimitQuery)

  const { data: requestedResponse } = usePromVector({
    baseUrl: preparedBaseUrl,
    query: preparedRequestedQuery ?? '',
    enabled: shouldFetchRequested && !isMultiqueryLoading,
    refetchInterval,
  })

  const { data: usedResponse } = usePromVector({
    baseUrl: preparedBaseUrl,
    query: preparedUsedQuery ?? '',
    enabled: shouldFetchCurrent && !isMultiqueryLoading,
    refetchInterval,
  })

  const { data: limitResponse } = usePromVector({
    baseUrl: preparedBaseUrl,
    query: preparedLimitQuery ?? '',
    enabled: shouldFetchLimit && !isMultiqueryLoading,
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

  const yDomain = useMemo<[number, number] | ['auto', 'auto']>(() => {
    const values = chartData.map(item => item.value).filter(Number.isFinite)

    if (values.length === 0) {
      return ['auto', 'auto']
    }

    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue

    if (!Number.isFinite(range)) {
      return ['auto', 'auto']
    }

    if (range === 0) {
      const pad = Math.max(Math.abs(maxValue) * 0.01, 1)
      return [maxValue - pad, maxValue + pad]
    }

    const pad = range * 0.1
    return [minValue - pad, maxValue + pad]
  }, [chartData])

  const resolvedRequested = requested ?? resolveVectorValue(requestedResponse)
  const resolvedUsed = used ?? resolveVectorValue(usedResponse)
  const resolvedLimit = limit ?? resolveVectorValue(limitResponse)

  const requestedPercent = clampPercent(resolvedRequested ?? NaN, resolvedLimit ?? NaN)
  const usedPercent = clampPercent(resolvedUsed ?? NaN, resolvedLimit ?? NaN)

  const limitPercent = 100

  const gradientMidStop = `${requestedPercent.toFixed(2)}%`

  const normalizedValues = [resolvedRequested, resolvedUsed, resolvedLimit]

  const tooltipTitle = (
    <Styled.TooltipContent $colorInfoBgHover={token.colorInfoBgHover}>
      <Styled.TooltipRow $colorText={token.colorText}>
        <Styled.TooltipDot $color="#5EDBBD" />
        Requested
      </Styled.TooltipRow>
      <Styled.TooltipRow $colorText={token.colorText}>
        <Styled.TooltipDot $color="#FF1C1C" />
        Used
      </Styled.TooltipRow>
      <Styled.TooltipRow $colorText={token.colorText}>
        <Styled.TooltipDot $color="#FD9125" />
        Limit
      </Styled.TooltipRow>
    </Styled.TooltipContent>
  )

  const updateUsedBadgeClamp = useCallback(() => {
    const container = badgesContainerRef.current
    const badge = usedBadgeRef.current

    if (!container || !badge || !Number.isFinite(usedPercent)) {
      setClampedUsedPercent(null)
      return
    }

    const containerWidth = container.clientWidth
    const badgeWidth = badge.offsetWidth

    if (containerWidth <= 0 || badgeWidth <= 0) {
      setClampedUsedPercent(null)
      return
    }

    const leftPx = (usedPercent / 100) * containerWidth
    const halfBadge = badgeWidth / 2
    const clampedPx = Math.min(Math.max(leftPx, halfBadge), containerWidth - halfBadge)
    const clampedPercent = (clampedPx / containerWidth) * 100

    setClampedUsedPercent(clampedPercent)
  }, [usedPercent])

  const updateRequestedLabelClamp = useCallback(() => {
    const container = badgesContainerRef.current
    const requestedLabel = requestedLabelRef.current
    const limitLabel = limitLabelRef.current

    if (
      !container ||
      !requestedLabel ||
      !limitLabel ||
      !Number.isFinite(requestedPercent) ||
      !Number.isFinite(limitPercent)
    ) {
      setClampedRequestedPercent(null)
      return
    }

    const containerWidth = container.clientWidth
    const requestedWidth = requestedLabel.offsetWidth
    const limitWidth = limitLabel.offsetWidth

    if (containerWidth <= 0 || requestedWidth <= 0 || limitWidth <= 0) {
      setClampedRequestedPercent(null)
      return
    }

    const requestedLeftPx = (requestedPercent / 100) * containerWidth
    const limitLeftPx = (limitPercent / 100) * containerWidth
    const requestedHalf = requestedWidth / 2
    const limitHalf = limitWidth / 2
    const limitLeftEdge = limitLeftPx - limitHalf
    const containerMin = 0
    const containerMax = containerWidth
    const maxLeftPx = limitLeftEdge - requestedHalf
    const clampedPx = Math.min(Math.max(requestedLeftPx, containerMin), containerMax, maxLeftPx)
    const clampedPercent = (clampedPx / containerWidth) * 100

    setClampedRequestedPercent(clampedPercent)
  }, [requestedPercent, limitPercent])

  useLayoutEffect(() => {
    updateUsedBadgeClamp()
    updateRequestedLabelClamp()

    const container = badgesContainerRef.current
    const badge = usedBadgeRef.current
    const requestedLabel = requestedLabelRef.current
    const limitLabel = limitLabelRef.current

    if (!container || !('ResizeObserver' in window)) {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      updateUsedBadgeClamp()
      updateRequestedLabelClamp()
    })

    observer.observe(container)
    if (badge) {
      observer.observe(badge)
    }
    if (requestedLabel) {
      observer.observe(requestedLabel)
    }
    if (limitLabel) {
      observer.observe(limitLabel)
    }

    return () => {
      observer.disconnect()
    }
  }, [updateUsedBadgeClamp, updateRequestedLabelClamp])

  return (
    <Styled.Wrapper style={containerStyle} $colorBgContainer={token.colorBgContainer} $colorBorder={token.colorBorder}>
      <Styled.Header>
        <Styled.Title $colorText={token.colorText}>{title}</Styled.Title>
      </Styled.Header>
      <Styled.ChartContainer>
        <Styled.ChartWrapper>
          <Styled.ChartInner>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <XAxis dataKey="index" hide />
                <YAxis hide domain={yDomain} padding={{ top: 6, bottom: 24 }} />
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
            color={token.colorInfoBgHover}
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
          <Styled.BadgesContainer ref={badgesContainerRef}>
            {resolvedRequested !== undefined && (
              <Styled.BarMarker $left={requestedPercent} $edgeAlign>
                <RequestedMarkerSvg />
              </Styled.BarMarker>
            )}
            {resolvedUsed !== undefined && (
              <Styled.BarMarker $left={usedPercent} $flipX $paddingTop={10}>
                <UsedMarkerSvg />
              </Styled.BarMarker>
            )}
            {resolvedLimit !== undefined && (
              <Styled.BarMarker $left={limitPercent}>
                <LimitMarkerSvg />
              </Styled.BarMarker>
            )}
            {resolvedUsed !== undefined && (
              <Styled.UsedBadge
                ref={usedBadgeRef}
                $left={clampedUsedPercent ?? usedPercent}
                $colorText={token.colorText}
                $colorBgContainer={token.colorBgContainer}
                $colorBorder={token.colorBorder}
              >
                <FormattedValue
                  value={resolvedUsed}
                  valueStrategy={valueStrategy}
                  valuePrecision={valuePrecision}
                  normalizedValues={normalizedValues}
                  hideUnit={hideUnit}
                />
                <span> used</span>
              </Styled.UsedBadge>
            )}
            {resolvedRequested !== undefined && (
              <Styled.MarkerLabel
                ref={requestedLabelRef}
                $left={clampedRequestedPercent ?? requestedPercent}
                $paddingLeft={3}
                $colorText={token.colorText}
              >
                <FormattedValue
                  value={resolvedRequested}
                  valueStrategy={valueStrategy}
                  valuePrecision={valuePrecision}
                  normalizedValues={normalizedValues}
                  hideUnit={hideUnit}
                />
                <span>requested</span>
              </Styled.MarkerLabel>
            )}
            {resolvedLimit !== undefined && (
              <Styled.MarkerLabel
                ref={limitLabelRef}
                $left={limitPercent}
                $paddingRight={3}
                $colorText={token.colorText}
              >
                <FormattedValue
                  value={resolvedLimit}
                  valueStrategy={valueStrategy}
                  valuePrecision={valuePrecision}
                  normalizedValues={normalizedValues}
                  hideUnit={hideUnit}
                />
                <span>limit</span>
              </Styled.MarkerLabel>
            )}
          </Styled.BadgesContainer>
        </Styled.GradientBarContainer>
      </Styled.GradientBarWrapper>
      {children}
    </Styled.Wrapper>
  )
}
