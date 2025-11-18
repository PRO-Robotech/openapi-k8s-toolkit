/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-nested-ternary */
import React, { FC, useEffect, useState, useRef, useCallback } from 'react'
import { theme as antdtheme, notification, Flex, Button, Modal, Typography } from 'antd'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { useNavigate } from 'react-router-dom'
import { TRequestError } from 'localTypes/api'
import { TJSON } from 'localTypes/JSON'
import { createNewEntry, updateEntry } from 'api/forms'
import { Styled } from './styled'

type TYamlEditorSingletonProps = {
  theme: 'light' | 'dark'
  cluster: string
  prefillValuesSchema?: TJSON
  isNameSpaced?: boolean
  isCreate?: boolean
  type: 'builtin' | 'apis'
  apiGroupApiVersion: string
  typeName: string
  backlink?: string | null
  designNewLayout?: boolean
  designNewLayoutHeight?: number
  openNotification?: boolean
  readOnly?: boolean
}

const NOTIFICATION_KEY = 'yaml-data-changed' // Single static key = only one notification

export const YamlEditorSingleton: FC<TYamlEditorSingletonProps> = ({
  theme,
  cluster,
  prefillValuesSchema,
  isNameSpaced,
  isCreate,
  type,
  apiGroupApiVersion,
  typeName,
  backlink,
  designNewLayout,
  designNewLayoutHeight,
  openNotification,
  readOnly = false,
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

  // Unified reload function — closes notification + applies latest data
  const handleReload = useCallback(() => {
    api.destroy(NOTIFICATION_KEY) // Always close the notification first

    const nextYaml = latestPrefillYamlRef.current ?? initialPrefillYamlRef.current
    if (nextYaml !== null) {
      setYamlData(nextYaml)
    }
  }, [api])

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
      setYamlData(nextYaml)

      firstLoadRef.current = false
      return
    }

    // subsequent updates: notify if changed
    if (nextYaml !== latestPrefillYamlRef.current) {
      openNotificationYamlChanged()
    }

    latestPrefillYamlRef.current = nextYaml
  }, [prefillValuesSchema, openNotificationYamlChanged])

  const onSubmit = () => {
    setIsLoading(true)
    setError(undefined)
    const currentValues = yaml.parse(yamlData)
    const { namespace } = currentValues.metadata as { namespace?: string }
    const { name } = currentValues.metadata as { name?: string }
    const body = currentValues
    const endpoint = `/api/clusters/${cluster}/k8s/${type === 'builtin' ? '' : 'apis/'}${apiGroupApiVersion}${
      isNameSpaced ? `/namespaces/${namespace}` : ''
    }/${typeName}/${isCreate ? '' : name}`
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
            <Button type="primary" onClick={onSubmit} loading={isLoading}>
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
        >
          An error has occurred: {error?.response?.data?.message}
        </Modal>
      )}
    </>
  )
}
