import React, { FC } from 'react'
import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb'
import { CollapsibleBreadcrumb } from '../../molecules'
import { Styled } from './styled'

export type TManageableBreadcrumbsProps = {
  data: { breadcrumbItems: BreadcrumbItemType[] }
}

export const ManageableBreadcrumbs: FC<TManageableBreadcrumbsProps> = ({ data }) => {
  return (
    <Styled.HeightDiv>
      {/* <Breadcrumb separator=">" items={data.breadcrumbItems} /> */}
      <CollapsibleBreadcrumb items={data.breadcrumbItems} />
    </Styled.HeightDiv>
  )
}
