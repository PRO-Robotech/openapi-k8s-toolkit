/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
import React, { FC, useEffect, useState, useRef } from 'react'
import { Flex, Result, Spin } from 'antd'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { Spacer, PauseCircleIcon, ResumeCircleIcon } from 'components/atoms'
import { Styled } from './styled'

type TMonacoEditorProps = {
  endpoint: string
  namespace: string
  podName: string
  container: string
  theme: 'dark' | 'light'
  substractHeight: number
  previous: boolean
}

export const MonacoEditor: FC<TMonacoEditorProps> = ({
  endpoint,
  namespace,
  podName,
  container,
  theme,
  substractHeight,
  previous,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Event>()
  const [isTerminalVisible, setIsTerminalVisible] = useState<boolean>(false)

  const [isPaused, setIsPaused] = useState<boolean>(false)

  const socketRef = useRef<WebSocket | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  // Handle editor mount
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  // Append content to editor
  const appendContent = (newContent: string) => {
    if (editorRef.current) {
      const currentContent = editorRef.current.getValue()
      editorRef.current.setValue(currentContent + newContent)

      // Optional: scroll to bottom
      const model = editorRef.current.getModel()
      if (model) {
        const lineCount = model.getLineCount()
        editorRef.current.revealLine(lineCount)
      }
    }
  }

  useEffect(() => {
    const socket = new WebSocket(endpoint)
    socketRef.current = socket

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'init',
          payload: { namespace, podName, container, previous },
        }),
      )
      console.log(`[${namespace}/${podName}]: WebSocket Client Connected`)
      setIsLoading(false)
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)
      if (data.type === 'ready') {
        setIsTerminalVisible(true)
      }
      if (data.type === 'output') {
        if (data.payload) {
          appendContent(data.payload)
        }
      }
    }

    socket.onclose = () => {
      console.log(`[${namespace}/${podName}]: WebSocket Client Closed`)
    }

    socket.onerror = error => {
      console.error('WebSocket Error:', error)
      setError(error)
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [endpoint, namespace, podName, container, previous])

  return (
    <>
      <Styled.VisibilityContainer $isVisible={isTerminalVisible}>
        <Flex justify="start" align="center" gap={16}>
          <Styled.CursorPointerDiv
            onClick={() => {
              if (isPaused) {
                setIsPaused(false)
                socketRef.current?.send(
                  JSON.stringify({
                    type: 'continue',
                  }),
                )
              } else {
                setIsPaused(true)
                socketRef.current?.send(
                  JSON.stringify({
                    type: 'stop',
                  }),
                )
              }
            }}
          >
            {isPaused ? <ResumeCircleIcon /> : <PauseCircleIcon />}
          </Styled.CursorPointerDiv>
          <div>{isPaused ? 'Not streaming events' : 'Streaming events'}</div>
        </Flex>
      </Styled.VisibilityContainer>
      <Spacer $space={16} $samespace />
      <Styled.CustomCard $isVisible={isTerminalVisible}>
        <Styled.FullWidthDiv>
          <Editor
            defaultLanguage="plaintext"
            language="plaintext"
            width="100%"
            height={`calc(100vh - ${substractHeight}px`}
            theme={theme === 'dark' ? 'vs-dark' : theme === undefined ? 'vs-dark' : 'vs'}
            options={{
              theme: theme === 'dark' ? 'vs-dark' : theme === undefined ? 'vs-dark' : 'vs',
              readOnly: true,
            }}
            onMount={handleEditorDidMount}
          />
        </Styled.FullWidthDiv>
      </Styled.CustomCard>

      {isLoading && !error && <Spin />}
      {error && <Result status="error" title="Error" subTitle={JSON.stringify(error)} />}
    </>
  )
}
