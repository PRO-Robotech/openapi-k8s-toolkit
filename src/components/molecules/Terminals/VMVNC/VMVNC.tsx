import React, { FC, useEffect, useRef, useState } from 'react'
import { Result, Spin, Button, Space } from 'antd'
import { Spacer } from 'components/atoms'
import { useVNCClient } from './hooks/useVNCClient'
import { VMVNCToolbar } from './molecules'
import { Styled } from './styled'

export type TVMVNCProps = {
  cluster?: string
  namespace?: string
  vmName?: string
  forcedFullWsPath?: string
  substractHeight: number
}

interface IFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => void
}

interface IFullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void> | void
  msExitFullscreen?: () => void
}

export const VMVNC: FC<TVMVNCProps> = ({ cluster, namespace, vmName, forcedFullWsPath, substractHeight }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const {
    screenRef,
    isLoading,
    error,
    status,
    isConnected,
    showDotCursor,
    scalingMode,
    setShowDotCursor,
    setScalingMode,
    disconnect,
    reconnect,
    sendCtrlAltDel,
  } = useVNCClient({ cluster, namespace, vmName, forcedFullWsPath })

  const handleToggleFullscreen = () => {
    const element = containerRef.current as IFullscreenElement | null
    if (!element) return

    // ENTER fullscreen
    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
      return
    }

    // EXIT fullscreen
    const fullscreenDoc = document as IFullscreenDocument

    if (fullscreenDoc.exitFullscreen) {
      fullscreenDoc.exitFullscreen()
    } else if (fullscreenDoc.webkitExitFullscreen) {
      fullscreenDoc.webkitExitFullscreen()
    } else if (fullscreenDoc.msExitFullscreen) {
      fullscreenDoc.msExitFullscreen()
    }
  }

  // fullscreen listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <Styled.Container ref={containerRef} $substractHeight={substractHeight}>
      <Styled.CustomCard $isVisible={!isLoading && !error} $substractHeight={substractHeight}>
        <VMVNCToolbar
          status={status}
          isConnected={isConnected}
          isFullscreen={isFullscreen}
          isLoading={isLoading}
          showDotCursor={showDotCursor}
          scalingMode={scalingMode}
          onSendCtrlAltDel={sendCtrlAltDel}
          onToggleFullscreen={handleToggleFullscreen}
          onReconnect={reconnect}
          onShowDotCursorChange={setShowDotCursor}
          onScalingModeChange={setScalingMode}
        />

        <Styled.ContentWrapper>
          <Styled.FullWidthDiv $substractHeight={substractHeight}>
            <div style={{ width: '100%', height: '100%' }} ref={screenRef} />
          </Styled.FullWidthDiv>
        </Styled.ContentWrapper>
      </Styled.CustomCard>

      {isLoading && !error && (
        <Styled.LoadingContainer>
          <Spin size="large" />
          <Spacer $space={16} $samespace />
          <div>{status}</div>
        </Styled.LoadingContainer>
      )}

      {error && !isLoading && (
        <Styled.ErrorContainer>
          <Result
            status="error"
            title="VNC Connection Error"
            subTitle={error}
            extra={
              <Space>
                <Button onClick={disconnect}>Disconnect</Button>
                <Button type="primary" onClick={reconnect} loading={isLoading}>
                  Reconnect
                </Button>
              </Space>
            }
          />
        </Styled.ErrorContainer>
      )}
    </Styled.Container>
  )
}
