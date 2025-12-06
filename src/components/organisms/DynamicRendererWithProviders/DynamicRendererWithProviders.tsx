import React, { ReactElement } from 'react'
import { useLocation } from 'react-router-dom'
import { TItemTypeMap } from 'localTypes/dynamicRender'
import { CursorDefaultDiv } from 'components/atoms'
import { prepareUrlsToFetchForDynamicRenderer } from 'utils/prepareUrlsToFetchForDynamicRenderer'
import { TUseK8sSmartResourceParams } from 'hooks/useK8sSmartResource'
import { DynamicRenderer, TDynamicRendererProps } from '../DynamicRenderer'
import { ThemeProvider } from './providers/themeContext'
import { FactoryConfigContextProvider } from './providers/factoryConfigProvider'
import { PartsOfUrlProvider } from './providers/partsOfUrlContext'
// import { MultiQueryProvider } from './multiQueryProvider'
import { MultiQueryProvider } from './providers/hybridDataProvider'

const STRING_KEYS = [
  'cluster',
  'apiGroup',
  'apiVersion',
  'plural',
  'namespace',
  'fieldSelector',
  'labelSelector',
] as const

export const DynamicRendererWithProviders = <T extends TItemTypeMap>(
  props: TDynamicRendererProps<T> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    urlsToFetch: (string | TUseK8sSmartResourceParams<any>)[]
    dataToApplyToContext?: unknown
    theme: 'dark' | 'light'
    nodeTerminalDefaultProfile?: string
    disableEventBubbling?: boolean
  },
): ReactElement => {
  const location = useLocation()
  const { urlsToFetch, dataToApplyToContext, theme, nodeTerminalDefaultProfile, disableEventBubbling } = props

  const directUrls = urlsToFetch.filter(el => typeof el === 'string') as string[]
  const k8sResourcesUrls = urlsToFetch.filter(el => typeof el !== 'string') as Pick<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TUseK8sSmartResourceParams<any>,
    'cluster' | 'apiGroup' | 'apiVersion' | 'plural' | 'namespace' | 'fieldSelector' | 'labelSelector' | 'limit'
  >[]

  const preparedUrlsToFetch: string[] = prepareUrlsToFetchForDynamicRenderer({
    urls: directUrls,
    locationPathname: location.pathname,
  })

  const preparedK8sResoucesUrls: Pick<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TUseK8sSmartResourceParams<any>,
    'cluster' | 'apiGroup' | 'apiVersion' | 'plural' | 'namespace' | 'fieldSelector' | 'labelSelector' | 'limit'
  >[] = k8sResourcesUrls.map(res => {
    let next = { ...res }
    // eslint-disable-next-line no-restricted-syntax
    for (const key of STRING_KEYS) {
      const val = next[key]
      if (typeof val === 'string' && val.length > 0) {
        const prepared = prepareUrlsToFetchForDynamicRenderer({
          urls: [val],
          locationPathname: location.pathname,
        })
        next = { ...next, [key]: prepared[0] ?? val }
      }
    }
    return next
  })

  return (
    <CursorDefaultDiv
      $default={disableEventBubbling}
      onClick={e => {
        if (disableEventBubbling) {
          e.stopPropagation()
        }
      }}
    >
      <ThemeProvider theme={theme}>
        <FactoryConfigContextProvider value={{ nodeTerminalDefaultProfile }}>
          <PartsOfUrlProvider value={{ partsOfUrl: location.pathname.split('/') }}>
            <MultiQueryProvider
              items={[...preparedK8sResoucesUrls, ...preparedUrlsToFetch]}
              dataToApplyToContext={dataToApplyToContext}
            >
              <DynamicRenderer {...props} />
            </MultiQueryProvider>
          </PartsOfUrlProvider>
        </FactoryConfigContextProvider>
      </ThemeProvider>
    </CursorDefaultDiv>
  )
}
