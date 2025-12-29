/* eslint-disable no-console */
import React, { FC, useEffect, useState, useRef, useCallback } from 'react'
import { Result } from 'antd'
import { Terminal as XTerm } from '@xterm/xterm'
import themes from 'xterm-theme'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { Styled } from '../XTerminal/styled'
import { TPodTerminalPayload } from '../XTerminal/types'

type TXTerminalContainerProps = {
  endpoint: string
  namespace: string
  podName: string
  containerName: string
  substractHeight: number
}

export const XTerminalContainer: FC<TXTerminalContainerProps> = ({
  endpoint,
  namespace,
  podName,
  containerName,
  substractHeight,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  const socketRef = useRef<WebSocket | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<XTerm | null>(null)
  const fitAddon = useRef<FitAddon>(new FitAddon())

  const connect = useCallback(() => {
    if (!terminalRef.current || terminalInstance.current) {
      return
    }

    // Create terminal
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
    fitAddon.current.fit()

    // Create WebSocket connection
    const socket = new WebSocket(endpoint)
    socketRef.current = socket

    socket.onopen = () => {
      const payload: TPodTerminalPayload = {
        namespace,
        podName,
        container: containerName,
      }
      socket.send(JSON.stringify({ type: 'init', payload }))
      console.log(`[${podName}/${containerName}]: Container terminal connected`)
      setIsConnected(true)
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)
      if (data.type === 'output') {
        if (data.payload.type === 'Buffer' && Array.isArray(data.payload.data)) {
          const text = Buffer.from(data.payload.data)
          terminal.write(text.toString('utf8'))
        } else {
          terminal.write(String(data.payload))
        }
      }
    }

    socket.onclose = () => {
      console.log(`[${podName}/${containerName}]: Container terminal closed`)
      setIsConnected(false)
    }

    socket.onerror = () => {
      console.error(`[${podName}/${containerName}]: Container terminal error`)
      setError('Failed to connect to container terminal')
      setIsConnected(false)
    }

    terminal.onData(data => {
      if (data === '\u001bOP') {
        socket.send(JSON.stringify({ type: 'input', payload: '\u001b[11~' }))
        return
      }
      socket.send(JSON.stringify({ type: 'input', payload: data }))
    })
  }, [endpoint, namespace, podName, containerName])

  // Initialize on mount
  useEffect(() => {
    connect()

    const handleResize = () => {
      fitAddon.current.fit()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (terminalInstance.current) {
        terminalInstance.current.dispose()
        terminalInstance.current = null
      }
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close()
      }
    }
  }, [connect])

  if (error) {
    return <Result status="error" title="Container Terminal Error" subTitle={error} />
  }

  return (
    <Styled.CustomCard $isVisible={isConnected} $substractHeight={substractHeight}>
      <Styled.FullWidthDiv $substractHeight={substractHeight}>
        <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
      </Styled.FullWidthDiv>
    </Styled.CustomCard>
  )
}
