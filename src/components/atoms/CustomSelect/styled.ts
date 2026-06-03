import styled from 'styled-components'
import { Select } from 'antd'

type TCustomSelectProps = {
  $paddingContainerEnd?: string
}

const CustomSelect = styled(Select)<TCustomSelectProps>`
  width: 100%;
  margin: 0;
  padding: 4px;

  /* stylelint-disable declaration-no-important */

  &&&.ant-select {
    background: none;
    padding-inline-end: ${({ $paddingContainerEnd }) => $paddingContainerEnd || '12px'} !important;
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

  &&.ant-select-multiple .ant-select-content-item-suffix {
    min-height: 22px !important;
    margin-block: 0 !important;
  }
`

export const Styled = {
  CustomSelect,
}
