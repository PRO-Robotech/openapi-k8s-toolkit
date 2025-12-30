/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { FC, useMemo } from 'react'
import { Button, Dropdown, MenuProps, Radio, Space, Switch, Tooltip } from 'antd'
import {
  FullscreenExitOutlined,
  FullscreenOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { TScalingMode } from '../../hooks/useVNCClient'
import { Styled } from './styled'

type TVMVNCToolbarProps = {
  status: string
  isConnected: boolean
  isFullscreen: boolean
  isLoading: boolean
  showDotCursor: boolean
  scalingMode: TScalingMode
  onSendCtrlAltDel: () => void
  onToggleFullscreen: () => void
  onReconnect: () => void
  onShowDotCursorChange: (value: boolean) => void
  onScalingModeChange: (mode: TScalingMode) => void
}

export const VMVNCToolbar: FC<TVMVNCToolbarProps> = ({
  status,
  isConnected,
  isFullscreen,
  isLoading,
  showDotCursor,
  scalingMode,
  onSendCtrlAltDel,
  onToggleFullscreen,
  onReconnect,
  onShowDotCursorChange,
  onScalingModeChange,
}) => {
  const optionsMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'show-cursor',
        label: (
          <Styled.ShowCursorDiv>
            <span>Show Cursor</span>
            <Switch checked={showDotCursor} onChange={onShowDotCursorChange} disabled={!isConnected} size="small" />
          </Styled.ShowCursorDiv>
        ),
      },
      {
        type: 'divider',
      },
      {
        key: 'scaling-mode',
        label: (
          <Styled.ScalingModeContainer>
            <Styled.ScalingModeTitle>Scaling Mode</Styled.ScalingModeTitle>
            <Radio.Group
              value={scalingMode}
              onChange={e => onScalingModeChange(e.target.value)}
              disabled={!isConnected}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <Radio value="none">None</Radio>
              <Radio value="local">Local scaling</Radio>
              <Radio value="remote">Remote resizing</Radio>
            </Radio.Group>
          </Styled.ScalingModeContainer>
        ),
      },
    ],
    [showDotCursor, scalingMode, isConnected, onShowDotCursorChange, onScalingModeChange],
  )

  return (
    <Styled.StatusBar>
      <Space size="small">
        <Tooltip title="Send Ctrl+Alt+Del">
          <Button
            type="text"
            size="small"
            icon={<PoweroffOutlined />}
            onClick={onSendCtrlAltDel}
            disabled={!isConnected}
            style={{ color: '#ffffff' }}
          >
            Send Ctrl+Alt+Del
          </Button>
        </Tooltip>

        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          <Button
            type="text"
            size="small"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={onToggleFullscreen}
            disabled={!isConnected}
            style={{ color: '#ffffff' }}
          >
            Fullscreen
          </Button>
        </Tooltip>

        <Dropdown menu={{ items: optionsMenuItems }} trigger={['click']} placement="bottomRight">
          <Button type="text" size="small" icon={<SettingOutlined />} style={{ color: '#ffffff' }}>
            Options
          </Button>
        </Dropdown>

        <Tooltip title="Reconnect">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={onReconnect}
            loading={isLoading}
            style={{ color: '#ffffff' }}
          >
            Reconnect
          </Button>
        </Tooltip>

        <Styled.StatusDivider>|</Styled.StatusDivider>
        <span>{status}</span>
      </Space>
    </Styled.StatusBar>
  )
}
