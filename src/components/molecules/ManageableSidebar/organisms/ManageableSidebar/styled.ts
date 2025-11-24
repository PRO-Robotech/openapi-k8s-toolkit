import styled from 'styled-components'
import { Menu } from 'antd'

type TCustomMenuProps = {
  $noMarginTop?: boolean
}

const CustomMenu = styled(Menu)<TCustomMenuProps>`
  margin-top: ${({ $noMarginTop }) => ($noMarginTop ? '0' : '16px')};
  font-size: 14px;
  line-height: 24px;
  border: 0;
  /* stylelint-disable declaration-no-important */
  border-inline-end: 0 !important;
  /* stylelint-enable declaration-no-important */

  .ant-menu-submenu-expand-icon {
    width: 16px;
  }

  && .ant-menu-item-only-child {
    /* stylelint-disable declaration-no-important */

    /* padding-left: 24px !important; */
  }

  && .ant-menu-sub .ant-menu-item {
    margin: 0 !important;
  }
`

export const Styled = {
  CustomMenu,
}
