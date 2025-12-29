import React, { FC, useEffect, useMemo, useState } from 'react'
import { Flex, Select, Typography } from 'antd'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { Spacer } from 'components/atoms'
import { useListWatch } from 'hooks/useListThenWatch'
import { XTerminal } from './molecules'
import { Styled } from './styled'

type TPodTemplateData = {
  metadata?: { name?: string }
  template?: {
    spec?: {
      containers?: Array<{ name?: string }>
    }
  }
}

export type TNodeTerminalProps = {
  cluster: string
  nodeName: string
  substractHeight: number
  listPodTemplatesNs: string // Required - namespace where PodTemplates are stored
}

export const NodeTerminal: FC<TNodeTerminalProps> = ({
  cluster,
  nodeName,
  substractHeight,
  listPodTemplatesNs,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)

  const lifecycleEndpoint = `/api/clusters/${cluster}/openapi-bff-ws/terminal/terminalNode/terminalNode`
  const containerEndpoint = `/api/clusters/${cluster}/openapi-bff-ws/terminal/terminalPod/terminalPod`

  // Fetch pod templates
  const podTemplatesWsUrl = `/api/clusters/${cluster}/openapi-bff-ws/listThenWatch/listWatchWs`
  const podTemplates = useListWatch({
    wsUrl: podTemplatesWsUrl,
    query: {
      apiVersion: 'v1',
      plural: 'podtemplates',
      namespace: listPodTemplatesNs,
    },
    isEnabled: Boolean(listPodTemplatesNs),
  })

  const podTemplateNames = useMemo(() => {
    const values = Object.values(podTemplates.state.byKey ?? {})
      .map(it => String((it as TPodTemplateData)?.metadata?.name ?? ''))
      .filter(Boolean)
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [podTemplates.state.byKey])

  // Get containers for selected template
  const containerNames = useMemo(() => {
    if (!selectedTemplate) return []

    const template = Object.values(podTemplates.state.byKey ?? {}).find(
      it => (it as TPodTemplateData)?.metadata?.name === selectedTemplate,
    ) as TPodTemplateData | undefined

    const containers = template?.template?.spec?.containers ?? []
    return containers.map(c => c.name).filter((name): name is string => Boolean(name))
  }, [podTemplates.state.byKey, selectedTemplate])

  // Auto-select first container when template is selected
  useEffect(() => {
    if (containerNames.length > 0) {
      setSelectedContainer(containerNames[0])
    } else {
      setSelectedContainer(null)
    }
  }, [containerNames])

  const templateOptions = useMemo(
    () => podTemplateNames.map(name => ({ value: name, label: name })),
    [podTemplateNames],
  )

  const containerOptions = useMemo(
    () => containerNames.map(name => ({ value: name, label: name })),
    [containerNames],
  )

  const hasMultipleContainers = containerNames.length > 1
  const canShowTerminal = selectedTemplate && selectedContainer

  const isLoading = podTemplates.status === 'connecting'

  // Show message if no pod templates
  if (podTemplateNames.length === 0 && !isLoading) {
    return (
      <Styled.EmptyState>
        <Typography.Text type="secondary">
          No PodTemplates found in namespace "{listPodTemplatesNs}".
        </Typography.Text>
        <Typography.Text type="secondary">
          Create a PodTemplate to use the node terminal.
        </Typography.Text>
      </Styled.EmptyState>
    )
  }

  return (
    <>
      <Flex gap={16}>
        {/* Template selector */}
        <Styled.CustomSelect>
          <Select
            placeholder="Select pod template"
            options={templateOptions}
            filterOption={filterSelectOptions}
            showSearch
            value={selectedTemplate}
            onChange={value => {
              setSelectedTemplate(value)
              setSelectedContainer(null)
            }}
            loading={isLoading}
          />
        </Styled.CustomSelect>

        {/* Container selector - visible but disabled until template selected */}
        <Styled.CustomSelect>
          <Select
            placeholder="Select container"
            options={containerOptions}
            filterOption={filterSelectOptions}
            showSearch
            value={selectedContainer}
            onChange={value => setSelectedContainer(value)}
            disabled={!selectedTemplate || !hasMultipleContainers}
          />
        </Styled.CustomSelect>
      </Flex>

      <Spacer $space={16} $samespace />

      {canShowTerminal && (
        <XTerminal
          key={`${cluster}-${nodeName}-${listPodTemplatesNs}-${selectedTemplate}`}
          lifecycleEndpoint={lifecycleEndpoint}
          containerEndpoint={containerEndpoint}
          nodeName={nodeName}
          podTemplateName={selectedTemplate}
          podTemplateNamespace={listPodTemplatesNs}
          selectedContainer={selectedContainer}
          substractHeight={substractHeight}
        />
      )}
    </>
  )
}
