export const getPathToNav = ({
  cluster,
  namespace,
  type,
  pathToNav,
  plural,
  apiGroup,
  apiVersion,
  baseprefix,
}: {
  cluster: string
  namespace: string
  type: string
  pathToNav?: string
  plural?: string
  apiGroup?: string
  apiVersion?: string
  baseprefix?: string
}): string => {
  const apiExtensionVersion = 'v1'

  if (type === 'direct' && pathToNav) {
    return pathToNav
  }

  if (type === 'crd') {
    return `/${baseprefix}/${cluster}/${namespace}/crd-table/${apiGroup}/${apiVersion}/${apiExtensionVersion}/${plural}`
  }

  if (type === 'nonCrd') {
    return `/${baseprefix}/${cluster}/${namespace}/api-table/${apiGroup}/${apiVersion}/${plural}`
  }

  return `/${baseprefix}/${cluster}/${namespace}/builtin-table/${plural}`
}

export const getCreatePathToNav = ({
  cluster,
  namespace,
  type,
  pathToNav,
  plural,
  apiGroup,
  apiVersion,
  baseprefix,
}: {
  cluster: string
  namespace: string
  type: string
  pathToNav?: string
  plural?: string
  apiGroup?: string
  apiVersion?: string
  baseprefix?: string
}): string => {
  if (type === 'direct' && pathToNav) {
    return pathToNav
  }

  if (type === 'crd') {
    return `/${baseprefix}/${cluster}/${namespace}/forms/crds/${apiGroup}/${apiVersion}/${plural}?backlink=${window.location.pathname}`
  }

  if (type === 'nonCrd') {
    return `/${baseprefix}/${cluster}/${namespace}/forms/apis/${apiGroup}/${apiVersion}/${plural}?backlink=${window.location.pathname}`
  }

  return `/${baseprefix}/${cluster}/${namespace}/forms/builtin/${apiVersion}/${plural}?backlink=${window.location.pathname}`
}

export const getListPath = ({
  cluster,
  namespace,
  type,
  plural,
  apiGroup,
  apiVersion,
}: {
  cluster: string
  namespace: string
  type: string
  plural?: string
  apiGroup?: string
  apiVersion?: string
}): string | undefined => {
  if (type === 'crd') {
    return `/api/clusters/${cluster}/k8s/apis/${apiGroup}/${apiVersion}${
      namespace ? `/namespaces/${namespace}` : ''
    }/${plural}`
  }

  if (type === 'nonCrd') {
    return `/api/clusters/${cluster}/k8s/apis/${apiGroup}/${apiVersion}${
      namespace ? `/namespaces/${namespace}` : ''
    }/${plural}`
  }

  return `/api/clusters/${cluster}/k8s/api/v1${namespace ? `/namespaces/${namespace}` : ''}/${plural}`
}
