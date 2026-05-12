/* eslint-disable no-console */
import React, { FC, useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { Spacer } from 'components/atoms'
import { XTerminal } from './molecules'
import { Styled } from './styled'
import { getScopedContainerNames } from './utils'

export type TPodTerminalProps = {
  cluster: string
  namespace: string
  podName: string
  containerName?: string
  containers: string[]
  substractHeight: number
}

export const PodTerminal: FC<TPodTerminalProps> = ({
  cluster,
  namespace,
  podName,
  containerName,
  containers,
  substractHeight,
}) => {
  const pinnedContainerName = containerName?.trim()
  const availableContainers = useMemo(
    () => getScopedContainerNames(containers, pinnedContainerName),
    [containers, pinnedContainerName],
  )
  const [currentContainer, setCurrentContainer] = useState<string | undefined>(availableContainers[0] || undefined)

  const endpoint = `/api/clusters/${cluster}/openapi-bff-ws/terminal/terminalPod/terminalPod`

  useEffect(() => {
    setCurrentContainer(prevContainer => {
      if (prevContainer && availableContainers.includes(prevContainer)) {
        return prevContainer
      }

      return availableContainers[0] || undefined
    })
  }, [availableContainers])

  if (pinnedContainerName && availableContainers.length === 0) {
    return <>Container &quot;{pinnedContainerName}&quot; is not running</>
  }

  if (availableContainers.length === 0) {
    return <>No Running Containers</>
  }

  return (
    <>
      <Styled.CustomSelect>
        <Select
          placeholder="Select container"
          options={availableContainers.map(container => ({ value: container, label: container }))}
          filterOption={filterSelectOptions}
          disabled={Boolean(pinnedContainerName)}
          showSearch
          value={currentContainer}
          onChange={value => {
            setCurrentContainer(value)
          }}
        />
      </Styled.CustomSelect>
      <Spacer $space={16} $samespace />
      {currentContainer && (
        <XTerminal
          endpoint={endpoint}
          namespace={namespace}
          podName={podName}
          container={currentContainer}
          substractHeight={substractHeight}
          key={`${cluster}-${namespace}-${podName}-${currentContainer}`}
        />
      )}
    </>
  )
}
