import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { checkIfApiInstanceNamespaceScoped, checkIfBuiltInInstanceNamespaceScoped } from 'api/bff/scopes/checkScopes'
import type { TUseK8sSmartResourceParams } from './useK8sSmartResourceWithoutKinds'

type TRawEntry = {
  cluster: string
  plural: string
  apiGroup?: string
  apiVersion?: string
}

export const useSmartResourceParams = ({ cluster, namespace }: { cluster: string; namespace?: string }) => {
  const [searchParams] = useSearchParams()

  const rawEntries = useMemo<TRawEntry[]>(() => {
    const raw = searchParams.get('resources')
    if (!raw) return []

    return raw
      .split(',')
      .map(entry => {
        const [apiGroup = '', apiVersion = '', plural = ''] = entry.split('/')

        const normalizedGroup = apiGroup === 'builtin' || apiGroup === '' ? undefined : apiGroup

        return {
          cluster,
          plural,
          apiGroup: normalizedGroup,
          apiVersion,
        }
      })
      .filter(e => Boolean(e.plural))
  }, [searchParams, cluster])

  const scopeQueries = useQueries({
    queries: rawEntries.map(e => {
      const isApi = Boolean(e.apiGroup)

      return {
        queryKey: ['resource-scope', e.cluster, isApi ? e.apiGroup : 'builtin', e.apiVersion ?? '', e.plural],
        enabled: Boolean(e.cluster && e.plural && (!isApi || e.apiVersion)),
        queryFn: () => {
          if (isApi) {
            return checkIfApiInstanceNamespaceScoped({
              plural: e.plural,
              apiGroup: e.apiGroup!,
              apiVersion: e.apiVersion || '',
              cluster: e.cluster,
            })
          }

          return checkIfBuiltInInstanceNamespaceScoped({
            plural: e.plural,
            cluster: e.cluster,
          })
        },
        staleTime: 5 * 60 * 1000,
      }
    }),
  })

  const scopesLoading = scopeQueries.some(q => q.isLoading)
  const scopesError = scopeQueries.find(q => q.error)?.error

  // IMPORTANT:
  // Always return params with length === rawEntries.length
  // so useManyK8sSmartResource doesn’t change hook count.
  const paramsList = useMemo<TUseK8sSmartResourceParams<unknown>[]>(() => {
    return rawEntries.map((e, i) => {
      const isClusterWide = scopeQueries[i]?.data?.isNamespaceScoped === false

      return {
        cluster: e.cluster,
        plural: e.plural,
        apiGroup: e.apiGroup,
        apiVersion: e.apiVersion || '',
        namespace: isClusterWide ? undefined : namespace,
      }
    })
  }, [rawEntries, scopeQueries, namespace])

  return {
    paramsList,
    scopesLoading,
    scopesError,
  }
}
