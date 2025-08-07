import React from 'react'
import { Link } from 'react-router-dom'
import { ItemType } from 'antd/es/menu/interface'
import { prepareTemplate } from 'utils/prepareTemplate'
import { TLink } from './types'

const mapLinksFromRaw = ({
  rawLinks,
  replaceValues,
}: {
  rawLinks: TLink[]
  replaceValues: Record<string, string | undefined>
}): (ItemType & { internalMetaLink?: string })[] => {
  return rawLinks.map(({ key, label, link, children }) => {
    const preparedLink = link ? prepareTemplate({ template: link, replaceValues }) : undefined
    return {
      key,
      label: preparedLink ? <Link to={preparedLink}>{label}</Link> : label,
      internalMetaLink: preparedLink,
      children: children
        ? mapLinksFromRaw({
            rawLinks: children,
            replaceValues,
          })
        : undefined,
    }
  })
}

const findMatchingItems = ({
  items,
  pathname,
  tags,
}: {
  items: (ItemType & { internalMetaLink?: string })[]
  pathname: string
  tags: { keysAndTags?: Record<string, string[]>; currentTags?: string[] }
}): React.Key[] => {
  const traverse = (nodes: (ItemType & { internalMetaLink?: string })[], parents: React.Key[]): React.Key[] =>
    nodes.flatMap(node => {
      const currentPath = [...parents, node.key ? node.key : String(node.key)]

      const cleanNodeInternalMetaLink = node.internalMetaLink?.startsWith('/')
        ? node.internalMetaLink.slice(1)
        : node.internalMetaLink
      const cleanPathname = pathname.startsWith('/') ? pathname.slice(1) : pathname
      // const matched =
      //   cleanNodeInternalMetaLink === cleanPathname ||
      //   (cleanNodeInternalMetaLink && currentPath && cleanNodeInternalMetaLink.includes(cleanPathname))
      //     ? currentPath
      //     : []
      const matched = cleanNodeInternalMetaLink === cleanPathname ? currentPath : []

      const tagsToMatch =
        tags && tags.keysAndTags && node.key
          ? tags.keysAndTags[typeof node.key === 'string' ? node.key : String(node.key)]
          : undefined
      const matchedByTags =
        tags && tags.currentTags && tagsToMatch && tagsToMatch.some(tag => tags.currentTags?.includes(tag))
          ? currentPath
          : []

      let childrenResults: React.Key[] = []

      if ('children' in node && node.children) {
        childrenResults = traverse(node.children as (ItemType & { internalMetaLink?: string })[], currentPath)
      }

      return [...matched, ...matchedByTags, ...childrenResults]
    })

  return traverse(items, [])
}

export const prepareDataForManageableSidebar = ({
  data,
  replaceValues,
  pathname,
  idToCompare,
  currentTags,
}: {
  data: { id: string; menuItems: TLink[]; keysAndTags?: Record<string, string[]> }[]
  replaceValues: Record<string, string | undefined>
  pathname: string
  idToCompare: string
  currentTags?: string[]
}): { menuItems: ItemType[]; selectedKeys: string[] } | undefined => {
  const foundData = data.find(el => el.id === idToCompare)

  if (!foundData) {
    return undefined
  }

  const result = {
    menuItems: mapLinksFromRaw({
      rawLinks: foundData.menuItems,
      replaceValues,
    }),
  }

  const openedKeys: React.Key[] = result?.menuItems
    ? findMatchingItems({
        items: result?.menuItems,
        pathname,
        tags: { keysAndTags: foundData.keysAndTags, currentTags },
      })
    : []
  const stringedOpenedKeys = openedKeys.map(el => (typeof el === 'string' ? el : String(el)))

  return { ...result, selectedKeys: stringedOpenedKeys }
}
