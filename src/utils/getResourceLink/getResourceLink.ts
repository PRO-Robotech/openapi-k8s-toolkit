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
}): string | undefined => {
  if (!pluralName || !name) {
    return undefined
  }

  if (apiGroupVersion === 'v1') {
    return `${baseprefix}/${cluster}${namespace ? `/${namespace}` : ''}/factory/${
      namespace ? baseFactoryNamespacedBuiltinKey : baseFactoryClusterSceopedBuiltinKey
    }/${apiGroupVersion}/${pluralName}/${name}`
  }

  return `${baseprefix}/${cluster}${namespace ? `/${namespace}` : ''}/factory/${
    namespace ? baseFactoryNamespacedAPIKey : baseFactoryClusterSceopedAPIKey
  }/${apiGroupVersion}/${pluralName}/${name}`
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
