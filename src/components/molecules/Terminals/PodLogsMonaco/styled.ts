import styled from 'styled-components'
import { Button } from 'antd'

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const ControlsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ControlsRight = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`

const FiltersGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ButtonsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const TopRowContent = styled.div`
  height: 35px;
  display: flex;
  align-items: center;
`

const CustomSelect = styled.div`
  .ant-select {
    width: 120px;

    @media (min-width: 1420px) {
      width: 160px;
    }

    @media (min-width: 1512px) {
      width: 200px;
    }
  }

  .ant-select-selection-placeholder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const FilterInput = styled.div`
  .ant-select,
  .ant-input-number,
  .ant-picker {
    width: 120px;
    height: 32px;
  }

  .ant-select-selection-placeholder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

type TFilterLabelProps = {
  $color: string
}

const FilterLabel = styled.span<TFilterLabelProps>`
  font-size: 13px;
  color: ${({ $color }) => $color};
  white-space: nowrap;
`

const SinceControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

type TFilterTitleProps = {
  $color: string
}

const FilterTitle = styled.div<TFilterTitleProps>`
  font-size: 16px;
  font-weight: 500;
  color: ${({ $color }) => $color};
  margin-bottom: 8px;
`

type TDarkSegmentedProps = {
  $colorBgLayout: string
  $colorBgContainer: string
  $colorTextSecondary: string
  $colorText: string
}

const DarkSegmented = styled.div<TDarkSegmentedProps>`
  .ant-segmented {
    background-color: ${({ $colorBgLayout }) => $colorBgLayout};
    height: 32px;
  }

  .ant-segmented-item {
    color: ${({ $colorTextSecondary }) => $colorTextSecondary};

    &:hover {
      color: ${({ $colorTextSecondary }) => $colorTextSecondary};
    }
  }

  .ant-segmented-item-selected {
    background-color: ${({ $colorBgContainer }) => $colorBgContainer};
    color: ${({ $colorText }) => $colorText};

    &:hover {
      color: ${({ $colorText }) => $colorText};
    }
  }

  .ant-segmented-thumb {
    background-color: ${({ $colorBgContainer }) => $colorBgContainer};
  }
`

const FilterButton = styled(Button)`
  height: 32px;
`

export const Styled = {
  ControlsRow,
  ControlsLeft,
  ControlsRight,
  FiltersGroup,
  ButtonsGroup,
  TopRowContent,
  CustomSelect,
  FilterInput,
  FilterRow,
  FilterGroup,
  FilterLabel,
  SinceControls,
  FilterTitle,
  DarkSegmented,
  FilterButton,
}
