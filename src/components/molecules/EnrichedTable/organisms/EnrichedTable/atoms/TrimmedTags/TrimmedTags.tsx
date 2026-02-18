import React, { FC } from 'react'
import { ConfigProvider, Popover, Flex } from 'antd'
import { Styled } from './styled'

type TTrimmedTagsProps = {
  tags: string[]
  trimLength?: number
}

export const TrimmedTags: FC<TTrimmedTagsProps> = ({ tags, trimLength }) => {
  const renderTableTags = (tags: string[]) => tags.map(tag => <Styled.TableTag key={tag}>{tag}</Styled.TableTag>)
  const popoverTheme = { components: { Popover: { zIndexPopup: 2100 } } }

  const renderTooltipTags = (tags: string[]) => (
    <Styled.TooltipTagsContainer vertical gap={4}>
      {tags.map(tag => (
        <Styled.TooltipTag key={tag}>{tag}</Styled.TooltipTag>
      ))}
    </Styled.TooltipTagsContainer>
  )

  if (trimLength && trimLength < tags.length) {
    return (
      <Flex wrap="nowrap" gap="4px">
        {renderTableTags(tags.slice(0, trimLength))}
        <ConfigProvider theme={popoverTheme}>
          <Popover
            content={renderTooltipTags(tags.slice(trimLength))}
            styles={{ root: { maxWidth: 'min(95vw, 900px)' } }}
          >
            <Styled.TableTag key="more">+{tags.length - trimLength}</Styled.TableTag>
          </Popover>
        </ConfigProvider>
      </Flex>
    )
  }

  return (
    <Flex wrap="nowrap" gap="4px">
      {renderTableTags(tags)}
    </Flex>
  )
}
