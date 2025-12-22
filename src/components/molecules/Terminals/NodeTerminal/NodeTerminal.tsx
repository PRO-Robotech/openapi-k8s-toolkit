/* eslint-disable no-console */
import React, { FC, useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { Spacer } from 'components/atoms'
import { useListWatch } from 'hooks/useListThenWatch'
import { XTerminal } from './molecules'
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
  listPodTemplatesNs = 'incloud-web',
}) => {
  const [currentProfile, setCurrentProfile] = useState<string>(defaultProfile || 'general')

  const endpoint = `/api/clusters/${cluster}/openapi-bff-ws/terminal/terminalNode/terminalNode`

  const podTemplatesWsUrl = `/api/clusters/${cluster}/openapi-bff-ws/listThenWatch/listWatchWs`
  const podTemplates = useListWatch({
    wsUrl: podTemplatesWsUrl,
    query: {
      apiVersion: 'v1',
      plural: 'podtemplates',
      namespace: listPodTemplatesNs,
    },
    preserveStateOnUrlChange: false,
    isEnabled: Boolean(listPodTemplatesNs && listPodTemplatesNs.length > 0),
  })

  const podTemplateNames = useMemo(() => {
    const values = Object.values(podTemplates.state.byKey ?? {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(it => String((it as any)?.metadata?.name ?? ''))
      .filter(Boolean)
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [podTemplates.state.byKey])

  const hasPodTemplates = podTemplateNames.length > 0

  const selectOptions = useMemo(() => {
    const predefinedOptions = PREDEFINED_PROFILES.map(profile => ({
      value: profile,
      label: profile,
    }))

    if (!hasPodTemplates) {
      return predefinedOptions
    }

    return [
      {
        label: 'Predefined Profiles',
        options: predefinedOptions,
      },
      {
        label: 'Custom PodTemplates',
        options: podTemplateNames.map(name => ({ value: name, label: name })),
      },
    ]
  }, [hasPodTemplates, podTemplateNames])

  const isPredefinedProfile = PREDEFINED_PROFILES.includes(currentProfile as typeof PREDEFINED_PROFILES[number])
  const selectedPodTemplateName = hasPodTemplates && !isPredefinedProfile ? currentProfile : undefined

  return (
    <>
      <Styled.CustomSelect>
        <Select
          placeholder="Select profile"
          options={selectOptions}
          filterOption={filterSelectOptions}
          showSearch
          value={currentProfile}
          onChange={value => setCurrentProfile(value)}
        />
      </Styled.CustomSelect>
      <Spacer $space={16} $samespace />
      {currentProfile && (
        <XTerminal
          endpoint={endpoint}
          nodeName={nodeName}
          profile={currentProfile}
          podTemplateName={selectedPodTemplateName}
          substractHeight={substractHeight}
          key={`${cluster}-${nodeName}-${listPodTemplatesNs}-${currentProfile}`}
        />
      )}
    </>
  )
}
