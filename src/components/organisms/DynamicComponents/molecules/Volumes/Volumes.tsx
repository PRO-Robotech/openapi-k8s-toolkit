/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import React, { FC, Suspense, useMemo } from 'react'
import jp from 'jsonpath'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { TAdditionalPrinterColumnsUndefinedValues } from 'localTypes/richTable'
import { TNavigationResource } from 'localTypes/navigations'
import { EnrichedTable } from 'components/molecules'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll } from '../utils'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { PerRequestError } from '../PerRequestError'
import {
  buildCustomColumns,
  getVolumeFactoryKey,
  getVolumeResourceLinkPrefix,
  getVolumeTypeHref,
  getVolumeTypeMetas,
  isLinkableVolumeTypeKey,
  isPendingLinkSegment,
  TVolumeTypeMeta,
} from './utils'

type TVolumeRow = TVolumeTypeMeta & {
  name: string
  mountPath: string
  subPath: string
  containerName: string
  podName: string
  namespace: string
  access: string
  key: string
  typeHref: string
}

type TVolumeRowWithoutHref = Omit<TVolumeRow, 'typeHref'>

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Mount Path', dataIndex: 'mountPath', key: 'mountPath' },
  { title: 'Sub Path', dataIndex: 'subPath', key: 'subPath' },
  { title: 'Type', dataIndex: 'typeName', key: 'typeName' },
  { title: 'Access', dataIndex: 'access', key: 'access' },
  { title: 'Utilized by', dataIndex: 'containerName', key: 'containerName' },
  // { title: 'Type', dataIndex: 'typeResource', key: 'typeResource' },
]

const undefinedValues: TAdditionalPrinterColumnsUndefinedValues = [
  { key: 'name', value: '-' },
  { key: 'mountPath', value: '-' },
  { key: 'subPath', value: '-' },
  { key: 'typeName', value: '-' },
  { key: 'access', value: '-' },
  { key: 'containerName', value: '-' },
]

const withUndefinedFallback = <T,>(value: T | null | undefined, fallback = '-'): T | string =>
  value === undefined || value === null || value === '' ? fallback : value

export const Volumes: FC<{ data: TDynamicComponentsAppTypeMap['Volumes']; children?: any }> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    baseprefix,
    cluster,
    reqIndex,
    jsonPathToSpec,
    jsonPathToPodName,
    forcedNamespace,
    errorText,
    containerStyle,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
    baseNavigationPluralName,
    baseNavigationSpecificName,
    containerFactoryKey,
  } = data
  const theme = useTheme()
  const partsOfUrl = usePartsOfUrl()

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors } = useMultiQuery()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })

  const forcedNamespacePrepared = forcedNamespace
    ? parseAll({
        text: forcedNamespace,
        replaceValues,
        multiQueryData,
      })
    : undefined

  const {
    data: navigationDataArr,
    isLoading: isNavigationLoading,
    isError: isNavigationError,
  } = useK8sSmartResource<{
    items: TNavigationResource[]
  }>({
    cluster: clusterPrepared,
    apiGroup: 'front.in-cloud.io',
    apiVersion: 'v1alpha1',
    plural: baseNavigationPluralName,
    fieldSelector: `metadata.name=${baseNavigationSpecificName}`,
  })

  const baseFactoriesMapping =
    navigationDataArr && navigationDataArr.items && navigationDataArr.items.length > 0
      ? navigationDataArr.items[0].spec?.baseFactoriesMapping
      : undefined

  const customColumns = useMemo(() => buildCustomColumns(containerFactoryKey), [containerFactoryKey])

  const dataSourceWithoutHref = useMemo<TVolumeRowWithoutHref[]>(() => {
    if (isMultiQueryLoading || isMultiQueryErrors || !multiQueryData) return []

    const jsonRoot = multiQueryData[`req${reqIndex}`] as any
    if (jsonRoot === undefined) return []

    const specResult = jp.query(jsonRoot || {}, `$${jsonPathToSpec}`)
    const spec: any = specResult?.[0]
    if (!spec) return []

    const fallbackNamespace = jsonRoot?.metadata?.namespace || spec?.metadata?.namespace || ''
    const effectiveNamespace = forcedNamespacePrepared || fallbackNamespace
    const podNameFromPath = jsonPathToPodName ? jp.query(jsonRoot || {}, `$${jsonPathToPodName}`)?.[0] : undefined
    const podName = podNameFromPath || jsonRoot?.metadata?.name || spec?.metadata?.name || '-'

    const containers: any[] = Array.isArray(spec.containers) ? spec.containers : []
    const volumes: any[] = Array.isArray(spec.volumes) ? spec.volumes : []
    const volumesMap: Record<string, any> = Array.isArray(volumes)
      ? volumes.reduce((acc: Record<string, any>, v: any) => {
          if (v?.name) acc[v.name] = v
          return acc
        }, {})
      : {}

    return containers.flatMap((container: any, cIdx: number) => {
      const mounts: any[] = Array.isArray(container.volumeMounts) ? container.volumeMounts : []
      return mounts.flatMap((mount: any, mIdx: number) =>
        getVolumeTypeMetas(mount.name, volumesMap).map((typeMeta: TVolumeTypeMeta, typeIdx: number) => {
          const typeName = String(withUndefinedFallback(typeMeta.typeName))

          return {
            ...typeMeta,
            ...mount,
            name: String(withUndefinedFallback(mount.name)),
            mountPath: String(withUndefinedFallback(mount.mountPath)),
            subPath: String(withUndefinedFallback(mount.subPath)),
            typeName,
            containerName: String(withUndefinedFallback(container.name || `container-${cIdx}`)),
            podName: String(podName),
            namespace: String(effectiveNamespace),
            access: String(withUndefinedFallback(mount.readOnly ? 'RO' : 'RW')),
            key: `${cIdx}-${mIdx}-${typeIdx}`,
          }
        }),
      )
    })
  }, [
    multiQueryData,
    isMultiQueryLoading,
    isMultiQueryErrors,
    reqIndex,
    jsonPathToSpec,
    jsonPathToPodName,
    forcedNamespacePrepared,
  ])

  const hasLinkableVolumeTypes = dataSourceWithoutHref.some(({ typeKey }) => isLinkableVolumeTypeKey(typeKey))

  const linkableNamespace = dataSourceWithoutHref.find(({ typeKey }) => isLinkableVolumeTypeKey(typeKey))?.namespace

  const configMapFactoryKey =
    hasLinkableVolumeTypes && !isNavigationLoading && !isNavigationError
      ? getVolumeFactoryKey({
          apiGroup: undefined,
          apiVersion: 'v1',
          resource: 'configmaps',
          namespace: linkableNamespace,
          baseFactoriesMapping,
          baseFactoryNamespacedAPIKey,
          baseFactoryClusterSceopedAPIKey,
          baseFactoryNamespacedBuiltinKey,
          baseFactoryClusterSceopedBuiltinKey,
        })
      : undefined

  const secretFactoryKey =
    hasLinkableVolumeTypes && !isNavigationLoading && !isNavigationError
      ? getVolumeFactoryKey({
          apiGroup: undefined,
          apiVersion: 'v1',
          resource: 'secrets',
          namespace: linkableNamespace,
          baseFactoriesMapping,
          baseFactoryNamespacedAPIKey,
          baseFactoryClusterSceopedAPIKey,
          baseFactoryNamespacedBuiltinKey,
          baseFactoryClusterSceopedBuiltinKey,
        })
      : undefined

  const hasPendingLinkPrefixInputs =
    hasLinkableVolumeTypes &&
    (isPendingLinkSegment(clusterPrepared) ||
      isPendingLinkSegment(linkableNamespace) ||
      isPendingLinkSegment(configMapFactoryKey) ||
      isPendingLinkSegment(secretFactoryKey))

  const isLinkPrefixLoading =
    hasLinkableVolumeTypes &&
    !isMultiQueryErrors &&
    !isNavigationError &&
    (isNavigationLoading || hasPendingLinkPrefixInputs)

  const resourceLinkPrefixes = useMemo<Partial<Record<'configMap' | 'secret', string>> | undefined>(() => {
    if (!hasLinkableVolumeTypes || isLinkPrefixLoading) {
      return undefined
    }

    return {
      configMap:
        getVolumeResourceLinkPrefix({
          baseprefix,
          cluster: clusterPrepared,
          namespace: linkableNamespace,
          apiGroupVersion: 'v1',
          pluralName: 'configmaps',
          baseFactoryNamespacedAPIKey,
          baseFactoryClusterSceopedAPIKey,
          baseFactoryNamespacedBuiltinKey,
          baseFactoryClusterSceopedBuiltinKey,
          baseFactoriesMapping,
        }) || '',
      secret:
        getVolumeResourceLinkPrefix({
          baseprefix,
          cluster: clusterPrepared,
          namespace: linkableNamespace,
          apiGroupVersion: 'v1',
          pluralName: 'secrets',
          baseFactoryNamespacedAPIKey,
          baseFactoryClusterSceopedAPIKey,
          baseFactoryNamespacedBuiltinKey,
          baseFactoryClusterSceopedBuiltinKey,
          baseFactoriesMapping,
        }) || '',
    }
  }, [
    hasLinkableVolumeTypes,
    isLinkPrefixLoading,
    baseprefix,
    clusterPrepared,
    linkableNamespace,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
    baseFactoriesMapping,
  ])

  const dataSource = useMemo<TVolumeRow[]>(
    () =>
      dataSourceWithoutHref.map(row => ({
        ...row,
        typeHref: getVolumeTypeHref({
          typeKey: row.typeKey,
          typeName: row.typeName,
          resourceLinkPrefixes,
        }),
      })),
    [dataSourceWithoutHref, resourceLinkPrefixes],
  )

  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  if (isMultiQueryLoading || isLinkPrefixLoading) {
    return <div>Loading...</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    return <div style={containerStyle}>{errorText}</div>
  }

  return (
    <div style={containerStyle}>
      <Suspense fallback={<div>Loading...</div>}>
        <EnrichedTable
          theme={theme}
          columns={columns}
          dataSource={dataSource}
          additionalPrinterColumnsUndefinedValues={undefinedValues}
          additionalPrinterColumnsKeyTypeProps={customColumns}
          withoutControls
          tableProps={{ disablePagination: true }}
        />
      </Suspense>
      {children}
    </div>
  )
}
