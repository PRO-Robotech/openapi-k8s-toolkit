/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-nested-ternary */
import React, { FC, useEffect, useState, useRef, useCallback } from 'react'
import { theme as antdtheme, notification, Flex, Button, Modal, Typography } from 'antd'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import * as yaml from 'yaml'
import { useNavigate } from 'react-router-dom'
import { TRequestError } from 'localTypes/api'
import { TJSON } from 'localTypes/JSON'
import { createNewEntry, updateEntry } from 'api/forms'
import { Styled } from './styled'
import { collapseManagedFieldsInEditor } from './utils'

type TYamlEditorSingletonProps = {
  theme: 'light' | 'dark'
  cluster: string
  prefillValuesSchema?: TJSON
  isNameSpaced?: boolean
  isCreate?: boolean
  type: 'builtin' | 'apis'
  apiGroupApiVersion: string
  plural: string
  backlink?: string | null
  designNewLayout?: boolean
  designNewLayoutHeight?: number
  openNotification?: boolean
  readOnly?: boolean
  canEdit?: boolean
}

const NOTIFICATION_KEY = 'yaml-data-changed' // Single static key = only one notification

// eslint-disable-next-line max-lines-per-function
export const YamlEditorSingleton: FC<TYamlEditorSingletonProps> = ({
  theme,
  cluster,
  prefillValuesSchema,
  isNameSpaced,
  isCreate,
  type,
  apiGroupApiVersion,
  plural,
  backlink,
  designNewLayout,
  designNewLayoutHeight,
  openNotification,
  readOnly = false,
  canEdit,
}) => {
  const { token } = antdtheme.useToken()
  const navigate = useNavigate()
  const [api, contextHolder] = notification.useNotification()

  const [yamlData, setYamlData] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TRequestError>()

  // store initial and latest prefill YAML
  const initialPrefillYamlRef = useRef<string | null>(null)
  const latestPrefillYamlRef = useRef<string | null>(null)
  // before applying any data yaml is empty
  const firstLoadRef = useRef(true)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const shouldCollapseOnNextYamlRef = useRef(false)
  const collapseRetriesRef = useRef(0)

  const collapseManagedFieldsIfNeeded = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return Promise.resolve(false)
    return collapseManagedFieldsInEditor(editor)
  }, [])

  const setYamlDataWithManagedFieldsCollapsed = useCallback((nextYaml: string) => {
    shouldCollapseOnNextYamlRef.current = true
    collapseRetriesRef.current = 0
    setYamlData(nextYaml)
  }, [])

  const tryCollapseManagedFields = useCallback(() => {
    if (!shouldCollapseOnNextYamlRef.current) return

    const MAX_RETRIES = 10
    const RETRY_DELAY_MS = 50

    setTimeout(() => {
      collapseManagedFieldsIfNeeded().then(collapsed => {
        if (collapsed) {
          shouldCollapseOnNextYamlRef.current = false
          collapseRetriesRef.current = 0
          return
        }

        collapseRetriesRef.current += 1
        if (collapseRetriesRef.current <= MAX_RETRIES) {
          tryCollapseManagedFields()
        }
      })
    }, RETRY_DELAY_MS)
  }, [collapseManagedFieldsIfNeeded])

  // Unified reload function — closes notification + applies latest data
  const handleReload = useCallback(() => {
    api.destroy(NOTIFICATION_KEY) // Always close the notification first

    const nextYaml = latestPrefillYamlRef.current ?? initialPrefillYamlRef.current
    if (nextYaml !== null) {
      setYamlDataWithManagedFieldsCollapsed(nextYaml)
    }
  }, [api, setYamlDataWithManagedFieldsCollapsed])

  // Show (or update) the "Data changed" notification — only one ever exists
  const openNotificationYamlChanged = useCallback(() => {
    const btn = (
      <Button
        type="primary"
        size="small"
        onClick={() => {
          handleReload()
        }}
      >
        Reload
      </Button>
    )

    api.info({
      key: NOTIFICATION_KEY,
      message: 'Data changed',
      description: 'The source data has been updated. Reload to apply the latest changes (will discard your edits).',
      btn,
      placement: 'bottomRight',
      duration: 30,
    })
  }, [api, handleReload])

  // Apply prefill only once automatically, but keep track of latest
  useEffect(() => {
    if (prefillValuesSchema === undefined) return

    const nextYaml = yaml.stringify(prefillValuesSchema)

    // first time: initialize and skip notification
    if (firstLoadRef.current) {
      initialPrefillYamlRef.current = nextYaml
      latestPrefillYamlRef.current = nextYaml
      setYamlDataWithManagedFieldsCollapsed(nextYaml)

      firstLoadRef.current = false
      return
    }

    // subsequent updates: notify if changed
    if (nextYaml !== latestPrefillYamlRef.current) {
      openNotificationYamlChanged()
    }

    latestPrefillYamlRef.current = nextYaml
  }, [prefillValuesSchema, openNotificationYamlChanged, setYamlDataWithManagedFieldsCollapsed])

  useEffect(() => {
    if (!shouldCollapseOnNextYamlRef.current) return undefined

    tryCollapseManagedFields()
    return undefined
  }, [yamlData, tryCollapseManagedFields])

  const onSubmit = () => {
    setIsLoading(true)
    setError(undefined)
    const currentValues = yaml.parse(yamlData)
    const { namespace } = currentValues.metadata as { namespace?: string }
    const { name } = currentValues.metadata as { name?: string }
    const body = currentValues
    const endpoint = `/api/clusters/${cluster}/k8s/${type === 'builtin' ? '' : 'apis/'}${apiGroupApiVersion}${
      isNameSpaced ? `/namespaces/${namespace}` : ''
    }/${plural}/${isCreate ? '' : name}`
    if (isCreate) {
      createNewEntry({ endpoint, body })
        .then(res => {
          console.log(res)
          if (backlink) {
            navigate(backlink)
          }
          setIsLoading(false)
          if (openNotification) {
            api.success({
              message: 'Created successfully',
              description: 'Entry was created',
              placement: 'topRight',
            })
          }
        })
        .catch(error => {
          console.log('Form submit error', error)
          setIsLoading(false)
          setError(error)
        })
    } else {
      updateEntry({ endpoint, body })
        .then(res => {
          console.log(res)
          if (backlink) {
            navigate(backlink)
          }
          setIsLoading(false)
          if (openNotification) {
            api.success({
              message: 'Updated successfully',
              description: 'Entry was updated',
              placement: 'bottomRight',
            })
          }
        })
        .catch(error => {
          console.log('Form submit error', error)
          setIsLoading(false)
          setError(error)
        })
    }
  }

  return (
    <>
      {contextHolder}
      <Styled.BorderRadiusContainer $designNewLayoutHeight={designNewLayoutHeight} $colorBorder={token.colorBorder}>
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={designNewLayoutHeight || '75vh'}
          value={yamlData}
          onMount={editor => {
            editorRef.current = editor
            if (shouldCollapseOnNextYamlRef.current) {
              tryCollapseManagedFields()
            }
          }}
          onChange={value => {
            if (!readOnly) {
              setYamlData(value || '')
            }
          }}
          theme={theme === 'dark' ? 'vs-dark' : theme === undefined ? 'vs-dark' : 'vs'}
          options={{
            theme: theme === 'dark' ? 'vs-dark' : theme === undefined ? 'vs-dark' : 'vs',
            readOnly,
          }}
        />
      </Styled.BorderRadiusContainer>
      {!readOnly && (
        <Styled.ControlsRowContainer $bgColor={token.colorPrimaryBg} $designNewLayout={designNewLayout}>
          <Flex gap={designNewLayout ? 10 : 16} align="center">
            <Button type="primary" onClick={onSubmit} loading={isLoading} disabled={canEdit === false}>
              Submit
            </Button>
            {backlink && <Button onClick={() => navigate(backlink)}>Cancel</Button>}
            <Button onClick={handleReload}>Reload</Button>
          </Flex>
        </Styled.ControlsRowContainer>
      )}
      {error && (
        <Modal
          open={!!error}
          onOk={() => setError(undefined)}
          onCancel={() => setError(undefined)}
          title={
            <Typography.Text type="danger">
              <Styled.BigText>Error!</Styled.BigText>
            </Typography.Text>
          }
          cancelButtonProps={{ style: { display: 'none' } }}
          centered
        >
          An error has occurred: {error?.response?.data?.message}
        </Modal>
      )}
    </>
  )
}
