/* eslint-disable no-console */
import React, { FC, useEffect, useState, useRef } from 'react'
import { Result, Spin } from 'antd'
import { Terminal as XTerm } from '@xterm/xterm'
import themes from 'xterm-theme'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { Styled } from './styled'

type TXTerminalProps = {
  endpoint: string
  namespace: string
  podName: string
  container: string
  substractHeight: number
}

export const XTerminal: FC<TXTerminalProps> = ({ endpoint, namespace, podName, container, substractHeight }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'init',
          payload: { namespace, podName, container },
        }),
      )
      console.log(`[${namespace}/${podName}]: WebSocket Client Connected`)
      setIsLoading(false)
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)
      if (data.type === 'error') {
        setError(data.payload)
        return
      }
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
      console.log(`[${namespace}/${podName}]: WebSocket Client Closed`)
    }

    socket.onerror = () => {
      console.error('WebSocket Error')
      setError('Failed to connect to terminal')
    }

    terminal.onData(data => {
      if (data === '\u001bOP') {
        socket.send(JSON.stringify({ type: 'input', payload: '\u001b[11~' }))
        return
      }
      socket.send(JSON.stringify({ type: 'input', payload: data }))
    })

    // eslint-disable-next-line consistent-return
    return () => {
      terminal.dispose()
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [terminal, endpoint, namespace, podName, container])

  return (
    <>
      <Styled.CustomCard $isVisible={!isLoading && !error} $substractHeight={substractHeight}>
        <Styled.FullWidthDiv $substractHeight={substractHeight}>
          <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
        </Styled.FullWidthDiv>
      </Styled.CustomCard>
      {isLoading && !error && <Spin />}
      {error && <Result status="error" title="Error" subTitle={error} />}
    </>
  )
}
