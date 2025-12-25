/* eslint-disable no-console */
import React, { FC, useEffect, useState, useRef } from 'react'
import { Result, Spin, Progress, Typography } from 'antd'
import { Terminal as XTerm } from '@xterm/xterm'
import themes from 'xterm-theme'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { TNodeTerminalPayload } from './types'
import { Styled } from './styled'

type TXTerminalProps = {
  endpoint: string
  nodeName: string
  profile: string
  isCustomTemplate?: boolean
  podTemplateNamespace?: string
  containerName?: string
  substractHeight: number
}

export const XTerminal: FC<TXTerminalProps> = ({
  endpoint,
  nodeName,
  profile,
  isCustomTemplate,
  podTemplateNamespace,
  containerName,
  substractHeight,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Event>()

  const [isTerminalVisible, setIsTerminalVisible] = useState<boolean>(false)

  const [warmupMessage, setWarmupMessage] = useState<string>()
  const [containerWaitingMessage, setContainerWaitingMessage] = useState<string>()

  const [progressPercent, setProgressPercent] = useState<number>(0)
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(true)

  const socketRef = useRef<WebSocket | null>(null)

  const [terminal, setTerminal] = useState<XTerm>()
  const terminalInstance = useRef<XTerm | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const fitAddon = useRef<FitAddon>(new FitAddon())

  useEffect(() => {
    if (!terminalRef.current) {
      return
    }

    const terminal = new XTerm({
      cursorBlink: false,
      cursorStyle: 'block',
      fontFamily: 'monospace',
      fontSize: 16,
      theme: themes.MaterialDark,
    })
    terminal.loadAddon(fitAddon.current)
    terminal.open(terminalRef.current)
    terminalInstance.current = terminal
    setTerminal(terminal)

    // Initial fit
    fitAddon.current.fit()

    // Handle resize events
    const handleResize = () => {
      fitAddon.current.fit()
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    // eslint-disable-next-line consistent-return
    return () => {
      window.removeEventListener('resize', handleResize)
      terminal.dispose()
    }
  }, [])

  useEffect(() => {
    if (!terminal) {
      return
    }

    const socket = new WebSocket(endpoint)
    socketRef.current = socket

    socket.onopen = () => {
      const payload: TNodeTerminalPayload = { nodeName, profile }
      if (isCustomTemplate) {
        payload.podTemplateName = profile
        payload.podTemplateNamespace = podTemplateNamespace
        payload.containerName = containerName
      }
      socket.send(JSON.stringify({ type: 'init', payload }))
      console.log(`[${nodeName}/${profile}]: WebSocket Client Connected`)
      setIsLoading(false)
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)
      if (data.type === 'warmup') {
        if (data.payload) {
          if (data.payload === 'Container ready') {
            setWarmupMessage(undefined)
            setContainerWaitingMessage(undefined)
            setIsTerminalVisible(true)
            setIsWarmingUp(false)
          } else if (data.payload === 'Container never ready') {
            setError(data.payload)
            setIsTerminalVisible(false)
            setWarmupMessage(undefined)
            setContainerWaitingMessage(undefined)
          } else {
            setWarmupMessage(data.payload)
            if (data.payload === 'Namespace creating') {
              setProgressPercent(15)
            }
            if (data.payload === 'Namespace created') {
              setProgressPercent(30)
            }
            if (data.payload === 'Pod creating') {
              setProgressPercent(45)
            }
            if (data.payload === 'Pod creating') {
              setProgressPercent(60)
            }
          }
        }
      }
      if (data.type === 'containerWaiting') {
        if (data.payload) {
          if (data.payload.includes('Container is ready')) {
            setContainerWaitingMessage(undefined)
          } else {
            setContainerWaitingMessage(data.payload)
          }
        }
      }
      if (data.type === 'output') {
        if (data.payload.type === 'Buffer' && Array.isArray(data.payload.data)) {
          // Reconstruct bytes and decode to string
          // const bytes = new Uint8Array(data.payload)
          // const text = decoderRef.current.decode(bytes)

          const text = Buffer.from(data.payload.data)
          terminal.write(text.toString('utf8'))
        } else {
          terminal.write(String(data.payload))
        }
      }
    }

    socket.onclose = () => {
      console.log(`[${nodeName}/${profile}]: WebSocket Client Closed`)
    }

    socket.onerror = error => {
      console.error('WebSocket Error:', error)
      setError(error)
      setIsTerminalVisible(false)
    }

    terminal.onData(data => {
      if (data === '\u001bOP') {
        // const bufferToSend = Buffer.from('\u001b[11~', 'utf8')
        // socket.send(JSON.stringify({ type: 'input', payload: bufferToSend }))
        socket.send(JSON.stringify({ type: 'input', payload: '\u001b[11~' }))
        return
      }
      // const bufferToSend = Buffer.from(data, 'utf8')
      // socket.send(JSON.stringify({ type: 'input', payload: bufferToSend }))
      socket.send(JSON.stringify({ type: 'input', payload: data }))
    })

    // terminal.onResize(size => {
    //   socket.send(JSON.stringify({ type: 'resize', payload: { cols: size.cols, rows: size.rows } }))
    // })

    // eslint-disable-next-line consistent-return
    return () => {
      terminal.dispose()
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [terminal, endpoint, nodeName, profile, isCustomTemplate, podTemplateNamespace, containerName])

  return (
    <>
      <Styled.CustomCard $isVisible={isTerminalVisible} $substractHeight={substractHeight}>
        <Styled.FullWidthDiv $substractHeight={substractHeight}>
          <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
        </Styled.FullWidthDiv>
      </Styled.CustomCard>
      {!isTerminalVisible && !error && isWarmingUp && (
        <Styled.ProgressContainer $substractHeight={substractHeight}>
          {isLoading && <Spin />}
          {!isLoading && <Progress type="circle" percent={progressPercent} />}
          {warmupMessage && <Typography.Text>Warming Up: {warmupMessage}</Typography.Text>}
          {containerWaitingMessage && <Typography.Text>Container Waiting: {containerWaitingMessage}</Typography.Text>}
        </Styled.ProgressContainer>
      )}
      {error && <Result status="error" title="Error" subTitle={JSON.stringify(error)} />}
    </>
  )
}
