import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import type { TUseK8sSmartResourceParams } from './useK8sSmartResourceWithoutKinds'

/**
 * A single hook whose return value is a plain constant array,
 * safe to pass to `useManyK8sSmartResource`.
 */
export const useSmartResourceParams = ({ cluster, namespace }: { cluster: string; namespace?: string }) => {
  const [searchParams] = useSearchParams()

  return useMemo<TUseK8sSmartResourceParams<unknown>[]>(() => {
    const raw = searchParams.get('resources')

    if (!raw) return []

    return raw.split(',').map(entry => {
      const [apiGroup = '', apiVersion = '', plural] = entry.split('/')

      return {
        cluster,
        namespace,
        apiGroup: apiGroup === 'builtin' ? undefined : apiGroup,
        apiVersion,
        plural,
      }
    })
  }, [searchParams, cluster, namespace])
}
