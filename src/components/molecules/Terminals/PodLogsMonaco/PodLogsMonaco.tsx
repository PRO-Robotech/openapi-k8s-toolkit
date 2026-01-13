/* eslint-disable no-console */
import React, { FC, useState, useEffect, useRef } from 'react'
import { Flex, Select, InputNumber, Radio, DatePicker, Button, theme as antdtheme, notification } from 'antd'
import type { RadioChangeEvent } from 'antd'
import type { Dayjs } from 'dayjs'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { Spacer } from 'components/atoms'
import { MonacoEditor } from './molecules'
import { Styled } from './styled'

const isValidRFC3339 = (dateString: string): boolean => {
  const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
  if (!rfc3339Regex.test(dateString)) {
    return false
  }
  const date = new Date(dateString)
  return !Number.isNaN(date.getTime())
}

const SINCE_PRESETS = [
  { label: '5 min', value: 300 },
  { label: '15 min', value: 900 },
  { label: '30 min', value: 1800 },
  { label: '1 hour', value: 3600 },
  { label: '2 hours', value: 7200 },
  { label: '6 hours', value: 21600 },
  { label: '12 hours', value: 43200 },
  { label: '24 hours', value: 86400 },
]

export type TPodLogsMonacoProps = {
  cluster: string
  namespace: string
  podName: string
  containers: string[]
  initContainers: string[]
  theme: 'dark' | 'light'
  substractHeight: number
  rawPodInfo: unknown & {
    status: unknown & {
      containerStatuses: { name: string; state?: unknown & { running?: unknown }; restartCount?: number }[]
    }
  }
  tailLines?: number
  sinceSeconds?: number
  sinceTime?: string
  limitBytes?: number
}

export const PodLogsMonaco: FC<TPodLogsMonacoProps> = ({
  cluster,
  namespace,
  podName,
  containers,
  initContainers,
  theme,
  substractHeight,
  rawPodInfo,
  tailLines,
  sinceSeconds,
  sinceTime,
  limitBytes,
}) => {
  const { token } = antdtheme.useToken()
  const [notificationApi, contextHolder] = notification.useNotification()
  const [currentContainer, setCurrentContainer] = useState<string | undefined>(containers[0] || undefined)
  const [previous, setPrevious] = useState<boolean>(false)
  const warningShownRef = useRef(false)

  useEffect(() => {
    if (sinceTime && !isValidRFC3339(sinceTime) && !warningShownRef.current) {
      warningShownRef.current = true
      notificationApi.warning({
        message: 'Invalid sinceTime format',
        description: `Value "${sinceTime}" is not valid RFC3339. Expected format: "2024-01-01T00:00:00Z"`,
        placement: 'bottomRight',
        duration: 10,
        style: { maxWidth: 400 },
      })
    }
  }, [sinceTime, notificationApi])

  const [pendingTailLines, setPendingTailLines] = useState<number | undefined>(tailLines)
  const [pendingSinceMode, setPendingSinceMode] = useState<'relative' | 'absolute'>(sinceTime ? 'absolute' : 'relative')
  const [pendingSinceSeconds, setPendingSinceSeconds] = useState<number | undefined>(sinceSeconds)
  const [pendingSinceTime, setPendingSinceTime] = useState<Dayjs | null>(null)
  const [pendingLimitKB, setPendingLimitKB] = useState<number | undefined>(
    limitBytes ? Math.round(limitBytes / 1024) : undefined
  )

  const [appliedFilters, setAppliedFilters] = useState({
    tailLines,
    sinceSeconds,
    sinceTime,
    limitBytes,
  })

  const [filterKey, setFilterKey] = useState(0)

  useEffect(() => {
    setPendingTailLines(tailLines)
    setPendingSinceSeconds(sinceSeconds)
    setPendingLimitKB(limitBytes ? Math.round(limitBytes / 1024) : undefined)
    setPendingSinceMode(sinceTime ? 'absolute' : 'relative')
  }, [tailLines, sinceSeconds, sinceTime, limitBytes])

  const matchingPreset = SINCE_PRESETS.find(p => p.value === pendingSinceSeconds)

  const handlePresetChange = (value: number | null) => {
    if (value !== null) {
      setPendingSinceSeconds(value)
    }
  }

  const handleSecondsInputChange = (value: number | null) => {
    setPendingSinceSeconds(value ?? undefined)
  }

  const handleSinceModeChange = (e: RadioChangeEvent) => {
    setPendingSinceMode(e.target.value)
  }

  const handleDateTimeChange = (value: Dayjs | null) => {
    setPendingSinceTime(value)
  }

  const handleApply = () => {
    const newFilters = {
      tailLines: pendingTailLines,
      sinceSeconds: pendingSinceMode === 'relative' ? pendingSinceSeconds : undefined,
      sinceTime: pendingSinceMode === 'absolute' && pendingSinceTime ? pendingSinceTime.toISOString() : undefined,
      limitBytes: pendingLimitKB ? pendingLimitKB * 1024 : undefined,
    }
    setAppliedFilters(newFilters)
    setFilterKey(prev => prev + 1)
  }

  const handleReset = () => {
    setPendingTailLines(tailLines)
    setPendingSinceSeconds(sinceSeconds)
    setPendingSinceTime(null)
    setPendingLimitKB(limitBytes ? Math.round(limitBytes / 1024) : undefined)
    setPendingSinceMode(sinceTime ? 'absolute' : 'relative')

    setAppliedFilters({ tailLines, sinceSeconds, sinceTime, limitBytes })
    setFilterKey(prev => prev + 1)
  }

  const endpoint = `/api/clusters/${cluster}/openapi-bff-ws/terminal/podLogs/podLogsNonWs`

  if (containers.length === 0) {
    return <>No Running Containers</>
  }

  const restartCount = rawPodInfo.status.containerStatuses.find(s => s.name === currentContainer)?.restartCount ?? 0
  const withPrevious = restartCount > 0
  const prevCurOptions = withPrevious
    ? [
        { value: 'current', label: 'Current log' },
        { value: 'previous', label: 'Previous log' },
      ]
    : [{ value: 'current', label: 'Current log' }]

  const options =
    initContainers.length > 0
      ? [
          {
            label: <span>Containers</span>,
            title: 'Containers',
            options: containers.map(container => ({ value: container, label: container })),
          },
          {
            label: <span>Init Containers</span>,
            title: 'Init Containers',
            options: initContainers.map(container => ({ value: container, label: container })),
          },
        ]
      : [
          {
            label: <span>Containers</span>,
            title: 'Containers',
            options: containers.map(container => ({ value: container, label: container })),
          },
        ]

  return (
    <>
      {contextHolder}
      <Styled.TopRowContent>
        <Flex gap={16}>
          <Styled.CustomSelect>
            <Select
              placeholder="Select container"
              options={options}
              filterOption={filterSelectOptions}
              disabled={containers.length === 0}
              showSearch
              value={currentContainer}
              onChange={value => {
                setCurrentContainer(value)
                setPrevious(false)
              }}
            />
          </Styled.CustomSelect>
          {currentContainer && (
            <Styled.CustomSelect>
              <Select
                placeholder="Select current/previous"
                options={prevCurOptions}
                filterOption={filterSelectOptions}
                disabled={!withPrevious}
                showSearch
                value={previous ? 'previous' : 'current'}
                onChange={value => {
                  if (value === 'previous') {
                    setPrevious(true)
                  } else {
                    setPrevious(false)
                  }
                }}
              />
            </Styled.CustomSelect>
          )}
        </Flex>
      </Styled.TopRowContent>
      <Spacer $space={8} $samespace />

      <Styled.FilterTitle $color={token.colorText}>Filters</Styled.FilterTitle>
      <Styled.FilterRow>
        <Styled.FilterGroup>
          <Styled.FilterLabel $color={token.colorTextSecondary}>Tail lines:</Styled.FilterLabel>
          <InputNumber
            min={1}
            placeholder="All"
            value={pendingTailLines}
            onChange={value => setPendingTailLines(value ?? undefined)}
            style={{ width: 100 }}
          />
        </Styled.FilterGroup>

        <Styled.FilterGroup>
          <Styled.FilterLabel $color={token.colorTextSecondary}>Since:</Styled.FilterLabel>
          <Radio.Group value={pendingSinceMode} onChange={handleSinceModeChange} size="small">
            <Radio.Button value="relative">Relative</Radio.Button>
            <Radio.Button value="absolute">Absolute</Radio.Button>
          </Radio.Group>
        </Styled.FilterGroup>

        {pendingSinceMode === 'relative' && (
          <Styled.SinceControls>
            <Select
              placeholder="Preset"
              options={SINCE_PRESETS}
              value={matchingPreset?.value ?? null}
              onChange={handlePresetChange}
              allowClear
              style={{ width: 100 }}
            />
            <InputNumber
              min={1}
              placeholder="sec"
              value={pendingSinceSeconds}
              onChange={handleSecondsInputChange}
              style={{ width: 100 }}
              addonAfter="sec"
            />
          </Styled.SinceControls>
        )}

        {pendingSinceMode === 'absolute' && (
          <DatePicker
            showTime
            value={pendingSinceTime}
            onChange={handleDateTimeChange}
            placeholder="Select date & time"
          />
        )}

        <Styled.FilterGroup>
          <Styled.FilterLabel $color={token.colorTextSecondary}>Limit:</Styled.FilterLabel>
          <InputNumber
            min={1}
            placeholder="No limit"
            value={pendingLimitKB}
            onChange={value => setPendingLimitKB(value ?? undefined)}
            style={{ width: 120 }}
            addonAfter="KB"
          />
        </Styled.FilterGroup>

        <Flex gap={8}>
          <Button
            size="small"
            onClick={handleReset}
            style={{
              color: '#c77777',
              borderColor: '#c77777',
            }}
          >
            Reset
          </Button>
          <Button
            size="small"
            onClick={handleApply}
            style={{
              backgroundColor: '#5a9a5a',
              borderColor: '#5a9a5a',
              color: '#fff',
            }}
          >
            Apply
          </Button>
        </Flex>
      </Styled.FilterRow>

      <Spacer $space={16} $samespace />
      {currentContainer && (
        <MonacoEditor
          endpoint={endpoint}
          namespace={namespace}
          podName={podName}
          container={currentContainer}
          theme={theme}
          substractHeight={substractHeight}
          previous={previous}
          tailLines={appliedFilters.tailLines}
          sinceSeconds={appliedFilters.sinceSeconds}
          sinceTime={appliedFilters.sinceTime}
          limitBytes={appliedFilters.limitBytes}
          key={`${cluster}-${namespace}-${podName}-${currentContainer}-${previous}-${filterKey}`}
        />
      )}
    </>
  )
}
