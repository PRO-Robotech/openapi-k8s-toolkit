/* eslint-disable no-console */
import React, { FC, useEffect, useState, useRef, useCallback } from 'react'
import { Result, Spin, Progress, Typography } from 'antd'
import { Styled } from './styled'
import { XTerminalContainer } from '../XTerminalContainer'
import { TNodeTerminalPayload, TPodReadyPayload } from './types'

type TXTerminalProps = {
  lifecycleEndpoint: string
  containerEndpoint: string
  nodeName: string
  podTemplateName: string
  podTemplateNamespace: string
  selectedContainer: string
  substractHeight: number
}
export const XTerminal: FC<TXTerminalProps> = ({
  lifecycleEndpoint,
  containerEndpoint,
  nodeName,
  podTemplateName,
  podTemplateNamespace,
  selectedContainer,
  substractHeight,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [warmupMessage, setWarmupMessage] = useState<string | null>(null)
  const [podWaitingMessage, setPodWaitingMessage] = useState<string | null>(null)
  const [progressPercent, setProgressPercent] = useState<number>(0)

  const [podInfo, setPodInfo] = useState<TPodReadyPayload | null>(null)

  const lifecycleSocketRef = useRef<WebSocket | null>(null)

  const connectLifecycle = useCallback(() => {
    const socket = new WebSocket(lifecycleEndpoint)
    lifecycleSocketRef.current = socket

    socket.onopen = () => {
      const payload: TNodeTerminalPayload = {
        nodeName,
        podTemplateName,
        podTemplateNamespace,
      }
      socket.send(JSON.stringify({ type: 'init', payload }))
      console.log(`[${nodeName}/${podTemplateName}]: Lifecycle WebSocket connected`)
      setIsLoading(false)
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)

      if (data.type === 'warmup') {
        const msg = data.payload
        setWarmupMessage(msg)

        if (msg === 'Namespace creating') setProgressPercent(15)
        else if (msg === 'Namespace created') setProgressPercent(30)
        else if (msg === 'Pod creating') setProgressPercent(45)
        else if (msg === 'Pod created') setProgressPercent(60)
        else if (msg === 'Pod waiting ready') setProgressPercent(75)
        else if (msg === 'Pod ready') setProgressPercent(100)
        else if (msg === 'Pod never ready' || msg.includes('error')) {
          setError(msg)
        }
      }

      if (data.type === 'podWaiting') {
        if (data.payload?.includes('Pod is running')) {
          setPodWaitingMessage(null)
        } else {
          setPodWaitingMessage(data.payload)
        }
      }

      if (data.type === 'podReady') {
        console.log(`[${nodeName}/${podTemplateName}]: Pod ready`, data.payload)
        setPodInfo(data.payload)
        setWarmupMessage(null)
        setPodWaitingMessage(null)
      }

      if (data.type === 'shutdown') {
        console.log(`[${nodeName}/${podTemplateName}]: Shutdown`, data.payload)
      }
    }

    socket.onclose = () => {
      console.log(`[${nodeName}/${podTemplateName}]: Lifecycle WebSocket closed`)
    }

    socket.onerror = () => {
      console.error(`[${nodeName}/${podTemplateName}]: Lifecycle WebSocket error`)
      setError('Failed to connect to pod lifecycle')
    }
  }, [lifecycleEndpoint, nodeName, podTemplateName, podTemplateNamespace])

  useEffect(() => {
    connectLifecycle()

    return () => {
      if (lifecycleSocketRef.current?.readyState === WebSocket.OPEN) {
        lifecycleSocketRef.current.close()
      }
    }
  }, [connectLifecycle])

  if (error) {
    return <Result status="error" title="Error" subTitle={error} />
  }

  if (!podInfo) {
    return (
      <Styled.ProgressContainer $substractHeight={substractHeight}>
        {isLoading ? (
          <Spin size="large" />
        ) : (
          <>
            <Progress type="circle" percent={progressPercent} />
            {warmupMessage && <Typography.Text type="secondary">{warmupMessage}</Typography.Text>}
            {podWaitingMessage && <Typography.Text type="warning">{podWaitingMessage}</Typography.Text>}
          </>
        )}
      </Styled.ProgressContainer>
    )
  }

  return (
    <XTerminalContainer
      key={`${podInfo.namespace}-${podInfo.podName}-${selectedContainer}`}
      endpoint={containerEndpoint}
      namespace={podInfo.namespace}
      podName={podInfo.podName}
      containerName={selectedContainer}
      substractHeight={substractHeight}
    />
  )
}
