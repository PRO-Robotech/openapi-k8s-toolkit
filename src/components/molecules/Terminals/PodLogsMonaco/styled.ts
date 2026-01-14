import styled from 'styled-components'

const TopRowContent = styled.div`
  height: 35px;
  display: flex;
  align-items: center;
`

const CustomSelect = styled.div`
  .ant-select {
    width: 200px;
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

export const Styled = {
  TopRowContent,
  CustomSelect,
  FilterRow,
  FilterGroup,
  FilterLabel,
  SinceControls,
  FilterTitle,
}
