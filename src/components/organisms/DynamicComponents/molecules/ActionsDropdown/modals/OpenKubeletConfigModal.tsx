import { FC, useMemo } from 'react'
import { Alert, Spin } from 'antd'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { ReadOnlyModal } from '../../../atoms/modals'
import { useTheme } from '../../../../DynamicRendererWithProviders/providers/themeContext'
import type { TOpenKubeletConfigActionProps } from '../../../types/ActionsDropdown'

type TOpenKubeletConfigModalProps = {
  open: boolean
  onClose: () => void
  props: TOpenKubeletConfigActionProps
}

const toYamlString = (value: unknown): string => {
  if (value === undefined) return ''

  if (typeof value === 'string') {
    try {
      return yaml.stringify(JSON.parse(value))
    } catch {
      return value
    }
  }

  return yaml.stringify(value)
}

export const OpenKubeletConfigModal: FC<TOpenKubeletConfigModalProps> = ({ open, onClose, props }) => {
  const theme = useTheme()

  const { data, isLoading, isError, error } = useDirectUnknownResource<unknown>({
    uri: props.url,
    queryKey: ['open-kubelet-config', props.url],
    refetchInterval: false,
    isEnabled: open && !!props.url && props.url !== '-',
  })

  const yamlData = useMemo(() => toYamlString(data), [data])

  return (
    <ReadOnlyModal
      open={open}
      close={onClose}
      modalTitle={props.modalTitle || props.text}
      modalDescriptionText={props.modalDescriptionText}
      editModalWidth={props.editModalWidth || 920}
    >
      {isLoading && <Spin />}
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load kubelet config"
          description={error instanceof Error ? error.message : 'Unknown error'}
        />
      )}
      {!isLoading && !isError && (
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height="60vh"
          value={yamlData}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
          }}
        />
      )}
    </ReadOnlyModal>
  )
}
