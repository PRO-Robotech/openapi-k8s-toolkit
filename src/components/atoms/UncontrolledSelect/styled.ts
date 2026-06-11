import styled from 'styled-components'
import { Select } from 'antd'

type TUncontrolledSelectProps = {
  $isCursorPointer?: boolean
}

const UncontrolledSelect = styled(Select)<TUncontrolledSelectProps>`
  width: 100%;
  margin: 0;
  padding: 4px;
  cursor: ${({ $isCursorPointer }) => ($isCursorPointer ? 'pointer' : 'default')};

  && input {
    /* stylelint-disable declaration-no-important */
    cursor: ${({ $isCursorPointer }) => ($isCursorPointer ? 'pointer' : 'default')} !important;
  }

  &&.ant-select {
    background: none;
    cursor: ${({ $isCursorPointer }) => ($isCursorPointer ? 'pointer' : 'default')};
  }

  &&.ant-select,
  &&.ant-select-focused,
  &&.ant-select:focus,
  &&.ant-select:active,
  &&.ant-select-open {
    align-items: flex-start;
    outline: none !important;
    outline-color: transparent !important;
    box-shadow: none !important;
    padding-inline: 4px !important;
    padding-block: 4px !important;
  }

  && .ant-select-content {
    gap: 4px;
  }

  && .ant-select-content-item-rest .ant-select-selection-item {
    background: 0;
  }

  && .ant-tag {
    font-size: 14px;
    line-height: 22px;
    border: 0;
    padding-inline: 8px;
  }
`

export const Styled = {
  UncontrolledSelect,
}
