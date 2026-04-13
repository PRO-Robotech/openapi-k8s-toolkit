/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useEffect, useMemo, useState } from 'react'
import { Tabs } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'

export const AntdTabs: FC<{ data: TDynamicComponentsAppTypeMap['antdTabs']; children?: any }> = ({
  data,
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, syncActiveKeyWithHash, allowOpenInNewBrowserTab, unmountOnTabChange, ...tabsProps } = data

  const destroyOnHidden = unmountOnTabChange ?? tabsProps.destroyOnHidden ?? true

  const tabKeys = useMemo(
    () => (tabsProps.items || []).map(item => item?.key).filter((key): key is string => typeof key === 'string'),
    [tabsProps.items],
  )

  const [hashActiveKey, setHashActiveKey] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    const hashValue = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    return hashValue || undefined
  })

  const tabItemsWithLinks = useMemo(() => {
    if (!allowOpenInNewBrowserTab || !tabsProps.items || typeof window === 'undefined') {
      return tabsProps.items
    }

    return tabsProps.items.map(item => {
      const tabKey = item?.key !== undefined && item?.key !== null ? String(item.key) : ''
      if (!tabKey) return item

      const href = `${window.location.pathname}${window.location.search}#${encodeURIComponent(tabKey)}`
      return {
        ...item,
        label: (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
            onClick={event => {
              if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                event.preventDefault()
              }
            }}
          >
            {item.label}
          </a>
        ),
      }
    })
  }, [allowOpenInNewBrowserTab, tabsProps.items])

  const updateUrlHash = (nextKey: string) => {
    if (typeof window === 'undefined') return

    const currentHash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (currentHash === nextKey) return

    const oldUrl = window.location.href
    const nextHash = `#${encodeURIComponent(nextKey)}`
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
    window.history.replaceState(window.history.state, '', nextUrl)

    if (typeof HashChangeEvent === 'function') {
      window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: oldUrl, newURL: window.location.href }))
    } else {
      window.dispatchEvent(new Event('hashchange'))
    }
  }

  useEffect(() => {
    if (!syncActiveKeyWithHash || typeof window === 'undefined') {
      return undefined
    }

    const readHashKey = () => {
      const hashValue = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      setHashActiveKey(hashValue || undefined)
    }

    readHashKey()
    window.addEventListener('hashchange', readHashKey)
    return () => window.removeEventListener('hashchange', readHashKey)
  }, [syncActiveKeyWithHash])

  const fallbackKey =
    (tabsProps.activeKey !== undefined ? String(tabsProps.activeKey) : undefined) ||
    (tabsProps.defaultActiveKey !== undefined ? String(tabsProps.defaultActiveKey) : undefined) ||
    tabKeys[0]

  const shouldValidateHashAgainstItems = tabKeys.length > 0
  const isHashKeyValid = !!hashActiveKey && (!shouldValidateHashAgainstItems || tabKeys.includes(hashActiveKey))
  const resolvedActiveKey = isHashKeyValid ? hashActiveKey : fallbackKey

  useEffect(() => {
    if (!syncActiveKeyWithHash || typeof window === 'undefined') return
    if (!resolvedActiveKey) return

    updateUrlHash(resolvedActiveKey)
  }, [resolvedActiveKey, syncActiveKeyWithHash])

  const onTabChange = (activeKey: string) => {
    tabsProps.onChange?.(activeKey)
    if (!syncActiveKeyWithHash || typeof window === 'undefined') return

    updateUrlHash(activeKey)
    setHashActiveKey(activeKey)
  }

  if (!syncActiveKeyWithHash) {
    return (
      <Tabs {...tabsProps} items={tabItemsWithLinks} destroyOnHidden={destroyOnHidden}>
        {children}
      </Tabs>
    )
  }

  return (
    <Tabs
      {...tabsProps}
      items={tabItemsWithLinks}
      destroyOnHidden={destroyOnHidden}
      activeKey={resolvedActiveKey}
      onChange={onTabChange}
    >
      {children}
    </Tabs>
  )
}
