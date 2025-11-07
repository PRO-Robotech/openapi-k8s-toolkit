/* eslint-disable no-nested-ternary */
import { useMemo } from 'react'
import { AxiosError } from 'axios'
import { TSingleResource } from 'localTypes/k8s'
import { useDirectUnknownResource } from './useDirectUnknownResource'
import { useK8sVerbs } from './useK8sVerbs'
import { useListWatch } from './useListThenWatch/useListWatch'

/** Build the K8s API prefix: core => /api/<v>, groups => /apis/<g>/<v> */
const buildApiPrefix = (group?: string, version?: string) => {
  const g = (group ?? '').trim()
  const v = (version ?? '').trim()
  const isCore = !g || g === 'core' || g === 'v1'
  return isCore ? `/api/${v}` : `/apis/${g}/${v}`
}

/** Build full REST list URI under the cluster base; respects namespace. */
const buildListUri = ({
  cluster,
  group,
  version,
  plural,
  namespace,
  fieldSelector,
  labelSelector,
}: {
  cluster: string
  group?: string
  version: string
  plural: string
  namespace?: string
  fieldSelector?: string
  labelSelector?: string
}) => {
  const prefix = buildApiPrefix(group, version)
  const ns = namespace ? `/namespaces/${namespace}` : ''
  const base = `/api/clusters/${cluster}/k8s${prefix}${ns}/${plural}/`

  const params = new URLSearchParams()
  if (fieldSelector) params.append('fieldSelector', fieldSelector)
  if (labelSelector) params.append('labelSelector', labelSelector)

  return params.toString() ? `${base}?${params.toString()}` : base
}

type UseK8sSmartResourceParams<T> = {
  cluster: string
  group?: string
  version: string
  plural: string
  namespace?: string
  fieldSelector?: string
  labelSelector?: string
  isEnabled?: boolean
  listRefetchInterval?: number | false
  mapListWatchState?: (state: { order: string[]; byKey: Record<string, TSingleResource> }) => T
}

type SmartResult<T> = {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: AxiosError | Error | string | undefined
  _meta?: { used: 'list' | 'watch' | 'disabled' | 'verbs-loading' | 'verbs-error' }
}

export const useK8sSmartResource = <T>({
  cluster,
  group,
  version,
  plural,
  namespace,
  fieldSelector,
  labelSelector,
  isEnabled = true,
  listRefetchInterval = 5000,
  mapListWatchState,
}: UseK8sSmartResourceParams<T>): SmartResult<T> => {
  // 1️⃣ Check verbs
  const {
    canList,
    canWatch,
    isLoading: verbsLoading,
    isError: verbsIsError,
    error: verbsErrorObj,
  } = useK8sVerbs({
    cluster,
    group,
    version,
    plural,
    isEnabled,
  })

  // 2️⃣ Build REST list URI
  const listUri = buildListUri({
    cluster,
    group,
    version,
    plural,
    namespace,
    fieldSelector,
    labelSelector,
  })

  // 3️⃣ REST list (when can list but can’t watch)
  const restEnabled = Boolean(isEnabled && canList && !canWatch && !verbsLoading && !verbsIsError)
  const {
    data: restData,
    isLoading: restLoading,
    isError: restIsError,
    error: restError,
  } = useDirectUnknownResource<T>({
    uri: listUri,
    queryKey: [
      'k8s-list',
      cluster,
      group || '',
      version,
      namespace || '',
      plural,
      fieldSelector || '',
      labelSelector || '',
    ],
    refetchInterval: listRefetchInterval,
    isEnabled: restEnabled,
  })

  // 4️⃣ list+watch (when can list and can watch)
  const watchEnabled = Boolean(isEnabled && canList && canWatch && !verbsLoading && !verbsIsError)
  const { state, status, lastError } = useListWatch({
    wsUrl: `/api/clusters/${cluster}/openapi-bff-ws/listThenWatch/listWatchWs`,
    paused: false,
    ignoreRemove: false,
    autoDrain: true,
    preserveStateOnUrlChange: true,
    isEnabled: watchEnabled,
    query: {
      apiGroup: group,
      apiVersion: version,
      plural,
      namespace,
      fieldSelector,
      labelSelector,
    },
  })

  // 5️⃣ Default mapper
  const defaultMap = (s: { order: string[]; byKey: Record<string, TSingleResource> }) =>
    ({ items: s.order.map(k => s.byKey[k]) }) as unknown as T

  const watchData = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (watchEnabled ? (mapListWatchState ?? defaultMap)(state as any) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watchEnabled, state, mapListWatchState],
  )

  // 6️⃣ Merge states
  const used: NonNullable<SmartResult<T>['_meta']>['used'] = !isEnabled
    ? 'disabled'
    : verbsLoading
    ? 'verbs-loading'
    : verbsIsError
    ? 'verbs-error'
    : watchEnabled
    ? 'watch'
    : restEnabled
    ? 'list'
    : 'disabled'

  const isLoading =
    (isEnabled && verbsLoading) || (used === 'watch' && status === 'connecting') || (used === 'list' && restLoading)

  let error: AxiosError | Error | string | undefined
  if (verbsIsError) error = verbsErrorObj as Error
  else if (used === 'watch' && status === 'closed' && lastError) error = lastError
  else if (used === 'list' && restIsError) error = restError as Error | undefined

  const isError = Boolean(error)

  const data: T | undefined = used === 'watch' ? watchData : used === 'list' ? restData : undefined

  return { data, isLoading, isError, error, _meta: { used } }
}
