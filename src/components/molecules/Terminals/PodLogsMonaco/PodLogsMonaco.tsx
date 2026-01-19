/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
import React, { FC, useState, useEffect, useRef } from 'react'
import { Select, InputNumber, Segmented, DatePicker, Button, theme as antdtheme, notification } from 'antd'
import type { Dayjs } from 'dayjs'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { isValidRFC3339 } from 'utils/converterDates'
import { Spacer } from 'components/atoms'
import { MonacoEditor } from './molecules'
import { Styled } from './styled'
import { SINCE_PRESETS, TAIL_LINES_PRESETS } from './constants'

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
    limitBytes ? Math.round(limitBytes / 1024) : undefined,
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

  const handleSinceModeChange = (value: 'relative' | 'absolute') => {
    setPendingSinceMode(value)
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
    return <>No Containers</>
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
      <Styled.ControlsRow>
        <Styled.ControlsLeft>
          <Styled.CustomSelect>
            <Select
              placeholder="Container"
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
                placeholder="Current/previous"
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
        </Styled.ControlsLeft>

        <Styled.ControlsRight>
          <Styled.FiltersGroup>
            <Styled.FilterSelect>
              <Select
                placeholder="Tail lines"
                options={TAIL_LINES_PRESETS}
                value={pendingTailLines}
                onChange={value => setPendingTailLines(value ?? undefined)}
                allowClear
                style={{ width: 140 }}
              />
            </Styled.FilterSelect>

            <Styled.DarkSegmented>
              <Segmented
                value={pendingSinceMode}
                onChange={handleSinceModeChange}
                options={[
                  { label: 'Relative', value: 'relative' },
                  { label: 'Absolute', value: 'absolute' },
                ]}
              />
            </Styled.DarkSegmented>

            {pendingSinceMode === 'relative' && (
              <Styled.FilterSelect>
                <Select
                  placeholder="Time range"
                  options={SINCE_PRESETS}
                  value={matchingPreset?.value ?? null}
                  onChange={handlePresetChange}
                  allowClear
                  style={{ width: 140 }}
                />
              </Styled.FilterSelect>
            )}

            {pendingSinceMode === 'absolute' && (
              <DatePicker
                showTime
                value={pendingSinceTime}
                onChange={handleDateTimeChange}
                placeholder="Date & time"
                style={{ height: 32 }}
              />
            )}

            <Styled.LimitInput>
              <InputNumber
                min={1}
                placeholder="Limit KB"
                value={pendingLimitKB}
                onChange={value => setPendingLimitKB(value ?? undefined)}
              />
            </Styled.LimitInput>
          </Styled.FiltersGroup>

          <Styled.ButtonsGroup>
            <Button onClick={handleReset} style={{ height: 32 }}>
              Clear
            </Button>
            <Button type="primary" onClick={handleApply} style={{ height: 32 }}>
              Apply
            </Button>
          </Styled.ButtonsGroup>
        </Styled.ControlsRight>
      </Styled.ControlsRow>

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
