import React, { FC, useEffect, useMemo, useState } from 'react'
import { Flex, Select } from 'antd'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { Spacer } from 'components/atoms'
import { useListWatch } from 'hooks/useListThenWatch'
import { XTerminal } from './molecules'
import { TPodTemplateData } from './types'
import { Styled } from './styled'

const PREDEFINED_PROFILES = ['legacy', 'general', 'baseline', 'netadmin', 'restricted', 'sysadmin'] as const

export type TNodeTerminalProps = {
  cluster: string
  nodeName: string
  substractHeight: number
  defaultProfile?: string
  listPodTemplatesNs?: string
}

export const NodeTerminal: FC<TNodeTerminalProps> = ({
  cluster,
  nodeName,
  substractHeight,
  defaultProfile,
  listPodTemplatesNs,
}) => {
  const [currentProfile, setCurrentProfile] = useState<string>(defaultProfile || 'general')
  const [currentContainer, setCurrentContainer] = useState<string | undefined>()

  const endpoint = `/api/clusters/${cluster}/openapi-bff-ws/terminal/terminalNode/terminalNode`

  const isUsingPodTemplates = Boolean(listPodTemplatesNs && listPodTemplatesNs.length > 0)

  const podTemplatesWsUrl = `/api/clusters/${cluster}/openapi-bff-ws/listThenWatch/listWatchWs`
  const podTemplates = useListWatch({
    wsUrl: podTemplatesWsUrl,
    query: {
      apiVersion: 'v1',
      plural: 'podtemplates',
      namespace: listPodTemplatesNs,
    },
    isEnabled: isUsingPodTemplates,
  })

  const podTemplateNames = useMemo(() => {
    const values = Object.values(podTemplates.state.byKey ?? {})
      .map(it => String((it as TPodTemplateData)?.metadata?.name ?? ''))
      .filter(Boolean)
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [podTemplates.state.byKey])

  const hasPodTemplates = podTemplateNames.length > 0

  const isCustomTemplate = isUsingPodTemplates && hasPodTemplates

  useEffect(() => {
    if (hasPodTemplates && !podTemplateNames.includes(currentProfile)) {
      setCurrentProfile(podTemplateNames[0])
    } else if (
      !hasPodTemplates &&
      !PREDEFINED_PROFILES.includes(currentProfile as (typeof PREDEFINED_PROFILES)[number])
    ) {
      setCurrentProfile(defaultProfile || 'general')
    }
  }, [hasPodTemplates, podTemplateNames, currentProfile, defaultProfile])

  const containerNames = useMemo(() => {
    if (!isCustomTemplate) return []

    const selectedTemplate = Object.values(podTemplates.state.byKey ?? {}).find(
      it => (it as TPodTemplateData)?.metadata?.name === currentProfile,
    ) as TPodTemplateData | undefined

    const containers = selectedTemplate?.template?.spec?.containers ?? []
    return containers.map(c => c.name).filter((name): name is string => Boolean(name))
  }, [isCustomTemplate, podTemplates.state.byKey, currentProfile])

  const hasMultipleContainers = containerNames.length > 1

  useEffect(() => {
    if (isCustomTemplate && containerNames.length > 0) {
      setCurrentContainer(containerNames[0])
    } else {
      setCurrentContainer(undefined)
    }
  }, [isCustomTemplate, containerNames])

  const selectOptions = useMemo(() => {
    if (hasPodTemplates) {
      return podTemplateNames.map(name => ({ value: name, label: name }))
    }

    return PREDEFINED_PROFILES.map(profile => ({
      value: profile,
      label: profile,
    }))
  }, [hasPodTemplates, podTemplateNames])

  const canShowTerminal = currentProfile && (!isCustomTemplate || currentContainer)

  return (
    <>
      <Flex gap={16}>
        <Styled.CustomSelect>
          <Select
            placeholder="Select profile"
            options={selectOptions}
            filterOption={filterSelectOptions}
            showSearch
            value={currentProfile}
            onChange={value => {
              setCurrentProfile(value)
              setCurrentContainer(undefined)
            }}
          />
        </Styled.CustomSelect>
        {isCustomTemplate && hasMultipleContainers && (
          <Styled.CustomSelect>
            <Select
              placeholder="Select container"
              options={containerNames.map(name => ({ value: name, label: name }))}
              filterOption={filterSelectOptions}
              showSearch
              value={currentContainer}
              onChange={value => setCurrentContainer(value)}
            />
          </Styled.CustomSelect>
        )}
      </Flex>
      <Spacer $space={16} $samespace />
      {canShowTerminal && (
        <XTerminal
          endpoint={endpoint}
          nodeName={nodeName}
          profile={currentProfile}
          isCustomTemplate={isCustomTemplate}
          podTemplateNamespace={isCustomTemplate ? listPodTemplatesNs : undefined}
          containerName={isCustomTemplate ? currentContainer : undefined}
          substractHeight={substractHeight}
          key={`${cluster}-${nodeName}-${listPodTemplatesNs}-${currentProfile}-${currentContainer}`}
        />
      )}
    </>
  )
}
