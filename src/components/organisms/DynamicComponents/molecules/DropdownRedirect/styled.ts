import styled from 'styled-components'
import { Select } from 'antd'

/**
 * Styled Select that looks like a title/header text with a dropdown chevron.
 * Removes borders, matches title typography.
 */

const TitleSelect = styled(Select)`
  &&.ant-select {
    cursor: pointer;

    &.ant-select {
      border: none;
      background: transparent;
      box-shadow: none;
      padding: 0;
      height: auto;
      cursor: pointer;
    }

    .ant-select-content {
      font-size: 20px;
      line-height: 24px;
      cursor: pointer;
    }

    .ant-select-suffix {
      font-size: 14px;
      cursor: pointer;
      color: inherit;
    }

    &:hover {
      border: none;
    }

    &.ant-select-focused {
      border: none;
      box-shadow: none;
    }
  }
`

export const Styled = {
  TitleSelect,
}
