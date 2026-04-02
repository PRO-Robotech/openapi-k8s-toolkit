/* eslint-disable @typescript-eslint/no-explicit-any */
import { TAdditionalPrinterColumnsKeyTypeProps } from 'localTypes/richTable'
import { parseApiVersion } from 'utils/getResourceLink/getResourceLink'

export const ellipsisStyle = {
  display: 'inline-block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  verticalAlign: 'bottom' as const,
}

const VOLUME_TYPE_LABELS: Record<string, string> = {
  awsElasticBlockStore: 'AwsElasticBlockStore',
  azureDisk: 'AzureDisk',
  azureFile: 'AzureFile',
  cephfs: 'Cephfs',
  cinder: 'Cinder',
  configMap: 'ConfigMap',
  csi: 'CSI',
  downwardAPI: 'DownwardAPI',
  emptyDir: 'EmptyDir',
  ephemeral: 'Ephemeral',
  fc: 'FC',
  flexVolume: 'FlexVolume',
  flocker: 'Flocker',
  gcePersistentDisk: 'GcePersistentDisk',
  gitRepo: 'GitRepo',
  glusterfs: 'Glusterfs',
  hostPath: 'HostPath',
  image: 'Image',
  iscsi: 'ISCSI',
  nfs: 'NFS',
  persistentVolumeClaim: 'PersistentVolumeClaim',
  photonPersistentDisk: 'PhotonPersistentDisk',
  portworxVolume: 'PortworxVolume',
  projected: 'Projected',
  quobyte: 'Quobyte',
  rbd: 'RBD',
  scaleIO: 'ScaleIO',
  secret: 'Secret',
  storageos: 'StorageOS',
  vsphereVolume: 'VsphereVolume',
}

export type TVolumeTypeMeta = {
  typeResource: string
  typeKey: string
  typeName: string
}

const getVolumeDisplayName = (typeKey: string, volumeConfig: any, fallbackName: string): string => {
  switch (typeKey) {
    case 'configMap':
      return volumeConfig?.name || fallbackName
    case 'secret':
      return volumeConfig?.secretName || fallbackName
    case 'persistentVolumeClaim':
      return volumeConfig?.claimName || fallbackName
    case 'azureDisk':
      return volumeConfig?.diskName || fallbackName
    case 'csi':
      return volumeConfig?.driver || fallbackName
    case 'image':
      return volumeConfig?.reference || fallbackName
    case 'projected':
      return Array.isArray(volumeConfig?.sources) && volumeConfig.sources.length > 0
        ? `${volumeConfig.sources.length} sources`
        : fallbackName
    default:
      return (
        volumeConfig?.volumeID ||
        volumeConfig?.path ||
        volumeConfig?.targetWWNs?.[0] ||
        volumeConfig?.datasetName ||
        volumeConfig?.repository ||
        volumeConfig?.server ||
        volumeConfig?.name ||
        fallbackName
      )
  }
}

const getVolumeTypeMeta = (volumeName: string, vol: any): TVolumeTypeMeta => {
  if (!vol) return { typeResource: 'Volume', typeKey: 'volume', typeName: volumeName }

  const matchedType = Object.keys(VOLUME_TYPE_LABELS).find(typeKey => Boolean(vol[typeKey]))
  if (matchedType) {
    return {
      typeResource: VOLUME_TYPE_LABELS[matchedType],
      typeKey: matchedType,
      typeName: getVolumeDisplayName(matchedType, vol[matchedType], volumeName),
    }
  }

  return { typeResource: 'Volume', typeKey: 'volume', typeName: volumeName }
}

const getProjectedSourceMeta = (projectedSource: any, fallbackName: string): TVolumeTypeMeta => {
  if (!projectedSource || typeof projectedSource !== 'object') {
    return { typeResource: 'Projected', typeKey: 'projected', typeName: fallbackName }
  }

  const projectedTypeKey = Object.keys(projectedSource).find(typeKey =>
    ['configMap', 'secret', 'downwardAPI', 'serviceAccountToken', 'clusterTrustBundle'].includes(typeKey),
  )

  if (!projectedTypeKey) {
    return { typeResource: 'Projected', typeKey: 'projected', typeName: fallbackName }
  }

  const sourceConfig = projectedSource[projectedTypeKey]

  if (projectedTypeKey === 'configMap') {
    return {
      typeResource: 'ConfigMap',
      typeKey: 'configMap',
      typeName: sourceConfig?.name || fallbackName,
    }
  }

  if (projectedTypeKey === 'secret') {
    return {
      typeResource: 'Secret',
      typeKey: 'secret',
      typeName: sourceConfig?.name || fallbackName,
    }
  }

  if (projectedTypeKey === 'downwardAPI') {
    return {
      typeResource: 'DownwardAPI',
      typeKey: 'downwardAPI',
      typeName: sourceConfig?.items?.[0]?.path || fallbackName,
    }
  }

  if (projectedTypeKey === 'serviceAccountToken') {
    return {
      typeResource: 'ServiceAccountToken',
      typeKey: 'serviceAccountToken',
      typeName: sourceConfig?.path || fallbackName,
    }
  }

  return {
    typeResource: 'ClusterTrustBundle',
    typeKey: 'clusterTrustBundle',
    typeName: sourceConfig?.path || sourceConfig?.name || fallbackName,
  }
}

export const getVolumeTypeMetas = (volumeName: string, volumesMap: Record<string, any>): TVolumeTypeMeta[] => {
  const vol = volumesMap[volumeName]
  if (!vol) return [getVolumeTypeMeta(volumeName, vol)]

  if (Array.isArray(vol?.projected?.sources) && vol.projected.sources.length > 0) {
    return vol.projected.sources.map((source: any) => getProjectedSourceMeta(source, volumeName))
  }

  return [getVolumeTypeMeta(volumeName, vol)]
}

export const buildCustomColumns = (containerFactoryKey?: string): TAdditionalPrinterColumnsKeyTypeProps => ({
  mountPath: {
    type: 'factory',
    customProps: {
      disableEventBubbling: true,
      items: [
        {
          type: 'parsedText',
          data: {
            id: 'mountPath-text',
            text: "{reqsJsonPath[0]['.mountPath']['-']}",
            tooltip: "{reqsJsonPath[0]['.mountPath']['-']}",
            style: ellipsisStyle,
          },
        },
      ],
    },
  },
  typeName: {
    type: 'factory',
    customProps: {
      disableEventBubbling: true,
      items: [
        {
          type: 'antdFlex',
          data: {
            align: 'center',
            direction: 'row',
            gap: 6,
            id: 'resource-badge-link-row',
          },
          children: [
            {
              type: 'ResourceBadge',
              data: {
                id: 'typeName-badge',
                value: "{reqsJsonPath[0]['.typeResource']['-']}",
              },
            },
            {
              type: 'VisibilityContainer',
              data: {
                id: 'typeName-link-visible',
                value: "{reqsJsonPath[0]['.typeHref']['']}",
                criteria: 'notEquals',
                valueToCompare: [''],
              },
              children: [
                {
                  type: 'antdLink',
                  data: {
                    href: "{reqsJsonPath[0]['.typeHref']['']}",
                    id: 'typeName-link',
                    text: "{reqsJsonPath[0]['.typeName']['-']}",
                    title: "{reqsJsonPath[0]['.typeName']['-']}",
                    style: ellipsisStyle,
                  },
                },
              ],
            },
            {
              type: 'VisibilityContainer',
              data: {
                id: 'typeName-text-visible',
                value: "{reqsJsonPath[0]['.typeHref']['']}",
                criteria: 'equals',
                valueToCompare: [''],
              },
              children: [
                {
                  type: 'parsedText',
                  data: {
                    id: 'typeName-text',
                    text: "{reqsJsonPath[0]['.typeName']['-']}",
                    tooltip: "{reqsJsonPath[0]['.typeName']['-']}",
                    style: ellipsisStyle,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  containerName: {
    type: 'factory',
    customProps: {
      disableEventBubbling: true,
      items: [
        {
          type: 'antdFlex',
          data: {
            align: 'center',
            direction: 'row',
            gap: 6,
            id: 'resource-badge-link-row',
          },
          children: [
            {
              type: 'ResourceBadge',
              data: {
                id: 'typeName-badge',
                value: 'Container',
              },
            },
            {
              type: containerFactoryKey ? 'antdLink' : 'parsedText',
              data: containerFactoryKey
                ? {
                    href: `/openapi-ui/{2}/{3}/factory/${containerFactoryKey}/v1/containers/{reqsJsonPath[0]['.podName']['-']}/{reqsJsonPath[0]['.containerName']['-']}`,
                    id: 'container-link',
                    text: "{reqsJsonPath[0]['.containerName']['-']}",
                    title: "{reqsJsonPath[0]['.containerName']['-']}",
                    style: ellipsisStyle,
                  }
                : {
                    id: 'container-text',
                    text: "{reqsJsonPath[0]['.containerName']['-']}",
                    tooltip: "{reqsJsonPath[0]['.containerName']['-']}",
                    style: ellipsisStyle,
                  },
            },
          ],
        },
      ],
    },
  },
})

export type TLinkableVolumeTypeKey = 'configMap' | 'secret' | 'persistentVolumeClaim'

export const isLinkableVolumeTypeKey = (typeKey: string): typeKey is TLinkableVolumeTypeKey =>
  typeKey === 'configMap' || typeKey === 'secret' || typeKey === 'persistentVolumeClaim'

export const isPendingLinkSegment = (value?: string): boolean =>
  !value || value.includes('...') || value.includes('{') || value.includes('}')

export const getVolumeFactoryKey = ({
  apiGroup,
  apiVersion,
  resource,
  namespace,
  baseFactoriesMapping,
  baseFactoryNamespacedAPIKey,
  baseFactoryClusterSceopedAPIKey,
  baseFactoryNamespacedBuiltinKey,
  baseFactoryClusterSceopedBuiltinKey,
}: {
  resource: string
  apiGroup?: string
  apiVersion: string
  namespace?: string
  baseFactoriesMapping?: Record<string, string>
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
}): string => {
  if (namespace) {
    if (apiGroup) {
      const forcedMapping =
        baseFactoriesMapping?.[`${baseFactoryNamespacedAPIKey}-${apiGroup}-${apiVersion}-${resource}`]
      return forcedMapping || baseFactoryNamespacedAPIKey || ''
    }

    const forcedMapping = baseFactoriesMapping?.[`${baseFactoryNamespacedBuiltinKey}-${apiVersion}-${resource}`]
    return forcedMapping || baseFactoryNamespacedBuiltinKey || ''
  }

  if (apiGroup) {
    const forcedMapping =
      baseFactoriesMapping?.[`${baseFactoryClusterSceopedAPIKey}-${apiGroup}-${apiVersion}-${resource}`]
    return forcedMapping || baseFactoryClusterSceopedAPIKey || ''
  }

  const forcedMapping = baseFactoriesMapping?.[`${baseFactoryClusterSceopedBuiltinKey}-${apiVersion}-${resource}`]
  return forcedMapping || baseFactoryClusterSceopedBuiltinKey || ''
}

export const getVolumeResourceLinkPrefix = ({
  baseprefix,
  cluster,
  namespace,
  apiGroupVersion,
  pluralName,
  baseFactoryNamespacedAPIKey,
  baseFactoryClusterSceopedAPIKey,
  baseFactoryNamespacedBuiltinKey,
  baseFactoryClusterSceopedBuiltinKey,
  baseFactoriesMapping,
}: {
  baseprefix?: string
  cluster: string
  namespace?: string
  apiGroupVersion: string
  pluralName: string
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseFactoriesMapping?: Record<string, string>
}): string => {
  const { apiGroup, apiVersion } = parseApiVersion(apiGroupVersion)

  return `${baseprefix}/${cluster}${namespace ? `/${namespace}` : ''}/factory/${getVolumeFactoryKey({
    apiGroup,
    apiVersion,
    resource: pluralName,
    namespace,
    baseFactoriesMapping,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
  })}/${apiGroupVersion}/${pluralName}`
}

export const getVolumeTypeHref = ({
  typeKey,
  typeName,
  resourceLinkPrefixes,
}: {
  typeKey: string
  typeName: string
  resourceLinkPrefixes?: Partial<Record<TLinkableVolumeTypeKey, string>>
}): string => {
  if (!isLinkableVolumeTypeKey(typeKey)) {
    return ''
  }

  const resourceLinkPrefix = resourceLinkPrefixes?.[typeKey]

  return resourceLinkPrefix ? `${resourceLinkPrefix}/${typeName}` : ''
}
