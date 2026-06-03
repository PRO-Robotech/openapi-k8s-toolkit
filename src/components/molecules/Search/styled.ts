import styled from 'styled-components'
// import { Form, Tag, Select, Input } from 'antd'
import { Form, Tag } from 'antd'

const SelectTag = styled(Tag)`
  margin-inline-end: 4px;
  padding: 4px 6px;
  display: inline-flex;
  align-items: center;
  white-space: normal;
  line-height: 1.1;
`

const SelectTagSpan = styled.span`
  display: inline-flex;
  flex-direction: column;
`

const MaxTagPlacheolder = styled.div`
  padding-left: 16px;
`

type TMaxTagPlaceholderLengthProps = {
  $colorBorder: string
}

const MaxTagPlacheolderLength = styled.span<TMaxTagPlaceholderLengthProps>`
  min-height: 20px;
  padding-right: 4px;
  padding-left: 4px;
  border: 1px solid ${({ $colorBorder }) => $colorBorder};
  border-radius: 20px;
  margin-right: 8px;
`

const OptionLabelKind = styled.div`
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
`

const OptionLabelVersion = styled.div`
  font-size: 10px;
  font-style: italic;
  font-weight: 400;
  line-height: 14px; /* 140% */
`

type TBackgroundContainerProps = {
  $colorBorder: string
  $colorBgLayout: string
  $visibleBackground?: boolean
}

const BackgroundContainer = styled.div<TBackgroundContainerProps>`
  width: 100%;
  gap: 8px;
  border: 1px solid
    ${({ $visibleBackground, $colorBorder }) => ($visibleBackground && $colorBorder ? $colorBorder : 'transparent')};
  border-radius: 6px;
  background: ${({ $visibleBackground, $colorBgLayout }) =>
    $visibleBackground && $colorBgLayout ? $colorBgLayout : 'initial'};
  padding: 8px;
`

const FormContainer = styled.div`
  display: grid;

  /* grid-template-columns: 3fr 9fr; */
  grid-template-columns: 3fr 130px 9fr;
  gap: 8px;
`

const ResetedFormItem = styled(Form.Item)`
  margin-bottom: 0;
`

type THideableContainerProps = {
  $isHidden?: boolean
}

const HideableContainer = styled.div<THideableContainerProps>`
  display: ${({ $isHidden }) => ($isHidden ? 'none' : 'initial')};
`

// const CompoundItem = styled.div`
//   display: grid;
//   grid-template-columns: 130px 1fr;
// `

// const LeftSideSelect = styled(Select)`
//   /* stylelint-disable declaration-no-important */

//   &.ant-select {
//     border-top-right-radius: 0 !important;
//     border-bottom-right-radius: 0 !important;
//     border-right-width: 0 !important;
//     height: 32px !important;
//   }
// `

// const RightSideInput = styled(Input)`
//   &&&.ant-input-outlined {
//     border-top-left-radius: 0 !important;
//     border-bottom-left-radius: 0 !important;
//     border-left-width: 0 !important;
//     height: 32px !important;
//   }
// `

// const RightSideSelect = styled(Select)`
//   &.ant-select {
//     border-top-left-radius: 0 !important;
//     border-bottom-left-radius: 0 !important;
//     border-left-width: 0 !important;
//     height: 32px !important;
//   }
// `

const BottomTagsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 50px;
  gap: 8px;
  margin-top: 8px;
`

const OptionsFlex = styled.div`
  display: flex;
  flex-flow: column;
  gap: 8px;
`

const BottomTagsRow = styled.div`
  display: grid;
  grid-template-columns: 45px 1fr;
  gap: 4px;
`

type TBottomTagsRowTextProps = {
  $colorDescription: string
}

const BottomTagsRowText = styled.div<TBottomTagsRowTextProps>`
  color: ${({ $colorDescription }) => $colorDescription};
  font-size: 12px;
  font-style: italic;
  font-weight: 400;
  line-height: 14px; /* 116.667% */
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  height: 100%;
  padding-top: 5px;
`

const BottomTagsHolder = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

const CustomTag = styled(Tag)`
  font-size: 14px;
  height: 22px;
  /* stylelint-disable declaration-no-important */
  margin-inline-end: 0 !important;
`

type TAbbrProps = {
  $bgColor: string
}

const Abbr = styled.span<TAbbrProps>`
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 13px;
  padding: 1px 5px;
  font-size: 13px;
  height: min-content;
  margin-right: 4px;
`

const ClearButtonHolder = styled.div`
  display: flex;
  justify-content: flex-end;
`

export const Styled = {
  SelectTag,
  SelectTagSpan,
  MaxTagPlacheolder,
  MaxTagPlacheolderLength,
  OptionLabelKind,
  OptionLabelVersion,
  BackgroundContainer,
  FormContainer,
  ResetedFormItem,
  HideableContainer,
  // CompoundItem,
  // LeftSideSelect,
  // RightSideInput,
  // RightSideSelect,
  BottomTagsContainer,
  OptionsFlex,
  BottomTagsRow,
  BottomTagsRowText,
  BottomTagsHolder,
  CustomTag,
  Abbr,
  ClearButtonHolder,
}
