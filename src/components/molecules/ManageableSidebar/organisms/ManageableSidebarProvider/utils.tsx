import React from 'react'
import { Link } from 'react-router-dom'
import { ItemType } from 'antd/es/menu/interface'
import { parseAll } from 'components/organisms/DynamicComponents/molecules/utils'
import { TLink } from './types'

const getLabel = ({
  preparedLink,
  label,
  key,
  externalKeys,
  replaceValues,
  multiQueryData,
}: {
  preparedLink?: string
  label: string
  key: string
  externalKeys?: string[]
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}): string | JSX.Element => {
  const preparedLabel = parseAll({ text: label, replaceValues, multiQueryData })
  if (preparedLink) {
    if (externalKeys && externalKeys.includes(key)) {
      return (
        <a
          // href={preparedLink}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()

            const url = preparedLink.startsWith('/') ? `${window.location.origin}${preparedLink}` : preparedLink

            // window.location.href = url
            window.open(url)
          }}
        >
          {preparedLabel}
        </a>
      )
    }
    return <Link to={preparedLink}>{preparedLabel}</Link>
  }
  return preparedLabel
}

const mapLinksFromRaw = ({
  rawLinks,
  replaceValues,
  multiQueryData,
  externalKeys,
}: {
  rawLinks: TLink[]
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
  externalKeys?: string[]
}): (ItemType & { internalMetaLink?: string })[] => {
  return rawLinks.map(({ key, label, link, children }) => {
    const preparedLink = link ? parseAll({ text: link, replaceValues, multiQueryData }) : undefined
    return {
      key,
      label: getLabel({ preparedLink, label, key, externalKeys, replaceValues, multiQueryData }),
      internalMetaLink: preparedLink,
      children: children
        ? mapLinksFromRaw({
            rawLinks: children,
            replaceValues,
            multiQueryData,
            externalKeys,
          })
        : undefined,
    }
  })
}

const findMatchingItems = ({
  items,
  pathname,
  searchParams,
  tags,
}: {
  items: (ItemType & { internalMetaLink?: string })[]
  pathname: string
  searchParams?: string
  tags: { keysAndTags?: Record<string, string[]>; currentTags?: string[] }
}): React.Key[] => {
  const normalizePath = (value?: string): string | undefined => {
    if (!value) {
      return undefined
    }
    return value.startsWith('/') ? value.slice(1) : value
  }

  const traverse = (nodes: (ItemType & { internalMetaLink?: string })[], parents: React.Key[]): React.Key[] =>
    nodes.flatMap(node => {
      const currentPath = [...parents, node.key ? node.key : String(node.key)]

      const cleanNodeInternalMetaLink = normalizePath(node.internalMetaLink)
      const cleanPathname = normalizePath(pathname.split('?')[0])
      let searchSuffix: string | undefined
      if (searchParams && searchParams.length > 0) {
        searchSuffix = searchParams.startsWith('?') ? searchParams : `?${searchParams}`
      }

      let pathnameWithSearch: string | undefined
      if (searchSuffix) {
        pathnameWithSearch = `${pathname}${searchSuffix}`
      } else if (pathname.includes('?')) {
        pathnameWithSearch = pathname
      }
      const cleanPathnameWithSearch = normalizePath(pathnameWithSearch)
      // const matched =
      //   cleanNodeInternalMetaLink === cleanPathname ||
      //   (cleanNodeInternalMetaLink && currentPath && cleanNodeInternalMetaLink.includes(cleanPathname))
      //     ? currentPath
      //     : []
      const matched =
        cleanNodeInternalMetaLink === cleanPathname ||
        (cleanPathnameWithSearch && cleanNodeInternalMetaLink === cleanPathnameWithSearch)
          ? currentPath
          : []

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
  multiQueryData = {},
  pathname,
  searchParams,
  idToCompare,
  fallbackIdToCompare,
  currentTags,
}: {
  data: { id: string; menuItems: TLink[]; keysAndTags?: Record<string, string[]>; externalKeys?: string[] }[]
  replaceValues: Record<string, string | undefined>
  multiQueryData?: Record<string, unknown>
  pathname: string
  searchParams?: string
  idToCompare: string
  fallbackIdToCompare?: string
  currentTags?: string[]
}): { menuItems: ItemType[]; selectedKeys: string[] } | undefined => {
  const foundData =
    data.find(el => el.id === idToCompare) ||
    (fallbackIdToCompare ? data.find(el => el.id === fallbackIdToCompare) : undefined)

  if (!foundData) {
    return undefined
  }

  const preparedCurrentTags =
    currentTags && currentTags.length > 0
      ? currentTags.map(el => parseAll({ text: el, replaceValues, multiQueryData }))
      : undefined

  const result = {
    menuItems: mapLinksFromRaw({
      rawLinks: foundData.menuItems,
      replaceValues,
      multiQueryData,
      externalKeys: foundData.externalKeys,
    }),
  }

  const openedKeys: React.Key[] = result?.menuItems
    ? findMatchingItems({
        items: result?.menuItems,
        pathname,
        searchParams,
        tags: { keysAndTags: foundData.keysAndTags, currentTags: preparedCurrentTags },
      })
    : []
  const stringedOpenedKeys = openedKeys.map(el => (typeof el === 'string' ? el : String(el)))

  return { ...result, selectedKeys: stringedOpenedKeys }
}
