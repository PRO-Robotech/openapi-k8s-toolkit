import styled from 'styled-components'

type TTableContainerProps = {
  $isDark?: boolean
  $isCursorPointer?: boolean
  $borderless?: boolean
  $isTotalLeft?: boolean
}

const TableContainer = styled.div<TTableContainerProps>`
  td {
    cursor: ${({ $isCursorPointer }) => $isCursorPointer && 'pointer'};
  }

  && .ant-table-container {
    border: ${({ $borderless, $isDark }) => {
      if ($borderless) {
        return '0'
      }
      return $isDark ? ' 1px solid rgba(255, 255, 255, 0.10)' : ' 1px solid #EAEAEC'
    }};
    border-bottom: 0;
  }

  && .ant-table-cell {
    font-size: 14px;
    line-height: 22px;
    padding: 10px 16px;
  }

  && thead .ant-table-cell {
    padding: 10px 16px;
  }

  && .controls {
    padding: 9px 12px;
  }

  && .ant-table-pagination {
    border: ${({ $borderless, $isDark }) => {
      if ($borderless) {
        return '0'
      }
      return $isDark ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid #EAEAEC'
    }};
    border-radius: 0 0 8px 8px;
    border-top: 0;
    margin: 0;
    padding: 8px 16px;
  }

  && .ant-pagination-total-text {
    position: ${({ $isTotalLeft }) => ($isTotalLeft ? 'initial' : 'absolute')};
    right: 16px;
  }

  && .ant-table-expanded-row-fixed {
    width: auto !important;
  }

  /* Virtual tables keep rc-virtual-list's own scrollbar; the custom synced scrollbar is disabled for them. */
  && .ant-table:not(.ant-table-virtual) .ant-table-content,
  && .ant-table:not(.ant-table-virtual) .ant-table-body {
    scrollbar-width: none;
  }

  && .ant-table:not(.ant-table-virtual) .ant-table-content::-webkit-scrollbar,
  && .ant-table:not(.ant-table-virtual) .ant-table-body::-webkit-scrollbar {
    height: 0;
    width: 0;
  }
`

const HideableControls = styled.div`
  && .ant-table-row .hideable {
    display: none;
  }

  && .ant-table-row:hover .hideable {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 4px;
  }
`

export const TableComponents = {
  TableContainer,
  HideableControls,
}
