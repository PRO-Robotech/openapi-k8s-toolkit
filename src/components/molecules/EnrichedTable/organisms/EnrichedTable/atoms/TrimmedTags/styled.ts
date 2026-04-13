import styled from 'styled-components'
import { Flex, Tag } from 'antd'

const TableTag = styled(Tag)`
  margin: 0;
  flex-shrink: 0;
`

const TooltipTagsContainer = styled(Flex)`
  max-width: min(95vw, 900px);
  min-width: min(60vw, 320px);
`

const TooltipTag = styled(Tag)`
  margin: 0;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Styled = {
  TableTag,
  TooltipTagsContainer,
  TooltipTag,
}
