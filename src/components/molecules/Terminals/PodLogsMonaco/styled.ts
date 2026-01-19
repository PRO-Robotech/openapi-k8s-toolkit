import styled from 'styled-components'

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
    width: 200px;

    @media (max-width: 1512px) {
      width: 160px;
    }

    @media (max-width: 1420px) {
      width: 120px;
    }
  }

  .ant-select-selection-placeholder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const FilterSelect = styled.div`
  .ant-select {
    height: 32px;
  }

  .ant-select-selection-placeholder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 1512px) {
    .ant-select {
      width: 120px;
    }
  }

  @media (max-width: 1420px) {
    .ant-select {
      width: 120px;
    }
  }
`

const LimitInput = styled.div`
  .ant-input-number {
    width: 100px;
    height: 32px;

    @media (max-width: 1420px) {
      width: 80px;
    }
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

const DarkSegmented = styled.div`
  .ant-segmented {
    background-color: #1e1f22;
    height: 32px;
  }

  .ant-segmented-item {
    color: rgba(255, 255, 255, 0.65);

    &:hover {
      color: rgba(255, 255, 255, 0.65);
    }
  }

  .ant-segmented-item-selected {
    background-color: #2d2f38;
    color: #fff;

    &:hover {
      color: #fff;
    }
  }

  .ant-segmented-thumb {
    background-color: #2d2f38;
  }
`

export const Styled = {
  ControlsRow,
  ControlsLeft,
  ControlsRight,
  FiltersGroup,
  ButtonsGroup,
  TopRowContent,
  CustomSelect,
  FilterSelect,
  LimitInput,
  FilterRow,
  FilterGroup,
  FilterLabel,
  SinceControls,
  FilterTitle,
  DarkSegmented,
}
