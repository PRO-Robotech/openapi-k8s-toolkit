import styled from 'styled-components'

const CustomSelect = styled.div`
  .ant-select {
    width: 200px;
  }

  .ant-select:not(.ant-select-disabled) {
    cursor: pointer;

    .ant-select-selector {
      cursor: pointer;
    }

    .ant-select-selection-search-input {
      cursor: pointer;
    }

    .ant-select-selection-placeholder,
    .ant-select-selection-item {
      cursor: pointer;
    }
  }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 8px;
`

export const Styled = {
  CustomSelect,
  EmptyState,
}
