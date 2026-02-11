import React from 'react'
import { Link } from 'react-router-dom'
import { ItemType } from 'antd/es/menu/interface'
import jp from 'jsonpath'
import { parseAll } from 'components/organisms/DynamicComponents/molecules/utils'
import { TLink } from './types'

export type TResourcesListFetchEntry = {
  nodePath: string
  k8sParams: {
    cluster: string
    apiGroup?: string
    apiVersion: string
    plural: string
    namespace?: string
    isEnabled: boolean
  }
}

export const collectLinksWithResourcesList = ({
  items,
  parentPath = '',
  replaceValues,
  multiQueryData,
  isEnabled,
}: {
  items: TLink[]
  parentPath?: string
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
  isEnabled?: boolean
}): TResourcesListFetchEntry[] =>
  items.flatMap(item => {
    const nodePath = parentPath ? `${parentPath}/${item.key}` : item.key

    const self = item.resourcesList
      ? (() => {
          const clusterPrepared = parseAll({
            text: item.resourcesList.cluster,
            replaceValues,
            multiQueryData,
          })
          const apiGroupPrepared = item.resourcesList.apiGroup
            ? parseAll({
                text: item.resourcesList.apiGroup,
                replaceValues,
                multiQueryData,
              })
            : undefined
          const apiVersionPrepared = parseAll({
            text: item.resourcesList.apiVersion,
            replaceValues,
            multiQueryData,
          })
          const pluralPrepared = parseAll({
            text: item.resourcesList.plural,
            replaceValues,
            multiQueryData,
          })
          const namespacePrepared = item.resourcesList.namespace
            ? parseAll({
                text: item.resourcesList.namespace,
                replaceValues,
                multiQueryData,
              })
            : undefined

          return [
            {
              nodePath,
              k8sParams: {
                cluster: clusterPrepared,
                apiGroup: apiGroupPrepared,
                apiVersion: apiVersionPrepared,
                plural: pluralPrepared,
                namespace: namespacePrepared,
                isEnabled: Boolean(clusterPrepared && apiVersionPrepared && pluralPrepared && isEnabled !== false),
              },
            },
          ]
        })()
      : []

    const nested = item.children
      ? collectLinksWithResourcesList({
          items: item.children,
          parentPath: nodePath,
          replaceValues,
          multiQueryData,
          isEnabled,
        })
      : []

    return [...self, ...nested]
  })

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
  resourcesListData,
  parentPath = '',
}: {
  rawLinks: TLink[]
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
  externalKeys?: string[]
  resourcesListData?: Record<string, { items?: Record<string, unknown>[] }>
  parentPath?: string
}): (ItemType & { internalMetaLink?: string })[] => {
  return rawLinks.map(({ key, label, link, children, resourcesList }) => {
    const nodePath = parentPath ? `${parentPath}/${key}` : key
    const preparedLink = link ? parseAll({ text: link, replaceValues, multiQueryData }) : undefined
    const staticChildren = children
      ? mapLinksFromRaw({
          rawLinks: children,
          replaceValues,
          multiQueryData,
          externalKeys,
          resourcesListData,
          parentPath: nodePath,
        })
      : []

    const dynamicChildrenRaw = resourcesList
      ? (resourcesListData?.[nodePath]?.items || [])
          .map((item, index) => {
            const resourceName = (() => {
              try {
                const value = jp.query(item, `$${resourcesList.jsonPathToName}`)[0]
                return value !== undefined && value !== null ? String(value) : undefined
              } catch {
                return undefined
              }
            })()

            if (!resourceName) {
              return undefined
            }

            const childLink = parseAll({
              text: resourcesList.linkToResource,
              replaceValues: { ...replaceValues, resourceName },
              multiQueryData,
            })

            const childKey = `${key}-${resourceName}-${index}`
            return {
              key: childKey,
              label: getLabel({
                preparedLink: childLink,
                label: resourceName,
                key: childKey,
                externalKeys,
                replaceValues,
                multiQueryData,
              }),
              internalMetaLink: childLink,
            }
          })
          .filter(Boolean)
      : []

    const dynamicChildren = dynamicChildrenRaw as (ItemType & { internalMetaLink?: string })[]

    const mergedChildren = [...staticChildren, ...dynamicChildren]

    return {
      key,
      label: getLabel({ preparedLink, label, key, externalKeys, replaceValues, multiQueryData }),
      internalMetaLink: preparedLink,
      children: mergedChildren.length > 0 ? mergedChildren : undefined,
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

const stripInternalMetaFromItems = (items: (ItemType & { internalMetaLink?: string })[]): ItemType[] =>
  items.map(item => {
    if (!item) {
      return item
    }

    const rest = { ...item }
    delete rest.internalMetaLink

    if ('children' in rest && Array.isArray(rest.children)) {
      return {
        ...rest,
        children: stripInternalMetaFromItems(rest.children as (ItemType & { internalMetaLink?: string })[]),
      }
    }

    return rest
  })

export const prepareDataForManageableSidebar = ({
  data,
  replaceValues,
  multiQueryData = {},
  pathname,
  searchParams,
  idToCompare,
  fallbackIdToCompare,
  currentTags,
  resourcesListData,
}: {
  data: { id: string; menuItems: TLink[]; keysAndTags?: Record<string, string[]>; externalKeys?: string[] }[]
  replaceValues: Record<string, string | undefined>
  multiQueryData?: Record<string, unknown>
  pathname: string
  searchParams?: string
  idToCompare: string
  fallbackIdToCompare?: string
  currentTags?: string[]
  resourcesListData?: Record<string, { items?: Record<string, unknown>[] }>
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
      resourcesListData,
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

  return { menuItems: stripInternalMetaFromItems(result.menuItems), selectedKeys: stringedOpenedKeys }
}
