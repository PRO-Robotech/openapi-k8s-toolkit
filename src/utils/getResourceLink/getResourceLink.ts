type TApiVersionParts = {
  apiGroup?: string
  apiVersion: string
}

export const parseApiVersion = (apiVersion: string): TApiVersionParts => {
  const parts = apiVersion.split('/')

  // Core API (no group, e.g., "v1")
  if (parts.length === 1) {
    return {
      apiGroup: undefined,
      apiVersion: parts[0],
    }
  }

  // Grouped API (e.g., "apps/v1", "networking.k8s.io/v1")
  return {
    apiGroup: parts[0],
    apiVersion: parts[1],
  }
}

const getFactoryKey = ({
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
  baseFactoriesMapping?: Record<string, string> | undefined
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

export const getResourceLink = ({
  baseprefix,
  cluster,
  namespace,
  apiGroupVersion,
  pluralName,
  name,
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
  pluralName?: string
  name?: string
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseFactoriesMapping?: Record<string, string>
}): string | undefined => {
  if (!pluralName || !name) {
    return undefined
  }

  const { apiGroup, apiVersion } = parseApiVersion(apiGroupVersion)

  if (apiGroupVersion === 'v1') {
    return `${baseprefix}/${cluster}${namespace ? `/${namespace}` : ''}/factory/${getFactoryKey({
      apiGroup,
      apiVersion,
      resource: pluralName,
      namespace,
      baseFactoriesMapping,
      baseFactoryNamespacedAPIKey,
      baseFactoryClusterSceopedAPIKey,
      baseFactoryNamespacedBuiltinKey,
      baseFactoryClusterSceopedBuiltinKey,
    })}/${apiGroupVersion}/${pluralName}/${name}`
  }

  return `${baseprefix}/${cluster}${namespace ? `/${namespace}` : ''}/factory/${getFactoryKey({
    apiGroup,
    apiVersion,
    resource: pluralName,
    namespace,
    baseFactoriesMapping,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
  })}/${apiGroupVersion}/${pluralName}/${name}`
}

export const getNamespaceLink = ({
  baseprefix,
  cluster,
  apiGroupVersion,
  pluralName,
  namespace,
  baseNamespaceFactoryKey,
}: {
  baseprefix?: string
  cluster: string
  pluralName: string
  apiGroupVersion: string
  namespace?: string
  baseNamespaceFactoryKey: string
}): string | undefined => {
  if (!namespace) {
    return undefined
  }

  return `${baseprefix}/${cluster}/factory/${baseNamespaceFactoryKey}/${apiGroupVersion}/${pluralName}/${namespace}`
}
