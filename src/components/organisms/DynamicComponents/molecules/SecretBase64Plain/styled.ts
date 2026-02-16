import styled, { createGlobalStyle, css } from 'styled-components'
import { Input } from 'antd'

const NoSelect = styled.div`
  * {
    user-select: none;
  }
`

type TDisabledInputProps = {
  $hidden?: boolean
}

const hiddenCursor = css<TDisabledInputProps>`
  /* stylelint-disable declaration-no-important */
  cursor: ${({ $hidden }) => ($hidden ? 'default' : 'pointer')} !important;
`

const DisabledInput = styled(Input)<TDisabledInputProps>`
  ${hiddenCursor}
`

const DisabledTextArea = styled(Input.TextArea)<TDisabledInputProps>`
  ${hiddenCursor}
`

const NotificationOverrides = createGlobalStyle`
  .no-message-notif .ant-notification-notice-message {
    margin-bottom: 0 !important;
  }
`

export const Styled = {
  NoSelect,
  DisabledInput,
  DisabledTextArea,
  NotificationOverrides,
}
