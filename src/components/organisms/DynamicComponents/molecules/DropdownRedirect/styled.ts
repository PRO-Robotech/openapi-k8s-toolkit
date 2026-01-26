import styled from 'styled-components'
import { Select } from 'antd'

/**
 * Styled Select that looks like a title/header text with a dropdown chevron.
 * Removes borders, matches title typography.
 */

const TitleSelect = styled(Select)`
  &&.ant-select {
    cursor: pointer;

    .ant-select-selector {
      border: none;
      background: transparent;
      box-shadow: none;
      padding: 0;
      height: auto;
      cursor: pointer;
    }

    .ant-select-selection-item {
      font-size: 20px;
      line-height: 24px;
      padding-inline-end: 24px;
      cursor: pointer;
    }

    .ant-select-arrow {
      font-size: 14px;
      right: 0;
      cursor: pointer;
      color: inherit;
    }

    &:hover .ant-select-selector {
      border: none;
    }

    &.ant-select-focused .ant-select-selector {
      border: none;
      box-shadow: none;
    }
  }
`

export const Styled = {
  TitleSelect,
}
