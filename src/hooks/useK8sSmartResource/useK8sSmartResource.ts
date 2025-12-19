// import { useEffect, useMemo, useState } from 'react'
import { useMemo } from 'react'
import type { TKindWithVersion } from 'localTypes/search'
// import { getKinds } from 'api/bff/search/getKinds'
import { kindByGvr } from 'utils/kindByGvr'
// import { getSortedKindsAll } from 'utils/getSortedKindsAll'
import { useKinds } from '../useKinds'
import { useK8sSmartResourceWithoutKinds, type TUseK8sSmartResourceParams } from './useK8sSmartResourceWithoutKinds'

/**
 * If T has an `{ items: U[] }` field, we add `kind?: string` and `apiVersion?: string` to each item.
 * Otherwise T is left unchanged.
 */
type TWithKindAndApiVersionOnItems<T> = T extends { items: (infer U)[] }
  ? Omit<T, 'items'> & { items: (U & { kind?: string; apiVersion?: string })[] }
  : T

/** Runtime guard: does value look like `{ items: unknown[] }`? */
const hasItemsArray = <T>(value: T | undefined): value is T & { items: unknown[] } => {
  if (!value || typeof value !== 'object') {
    return false
  }
  if (!('items' in value)) {
    return false
  }
  const { items } = value as { items: unknown }
  return Array.isArray(items)
}

/**
 * Same params as useK8sSmartResource.
 * Returns the same shape as useK8sSmartResource,
 * but if `data.items` exists, items are enriched with `kind`.
 */
export const useK8sSmartResource = <T>(params: TUseK8sSmartResourceParams<T>) => {
  const { cluster, apiGroup, apiVersion, plural } = params

  // 1️⃣ Base hook (verbs + list/watch)
  const base = useK8sSmartResourceWithoutKinds<T>(params)

  // 2️⃣ Get kinds via React Query
  const { data: kindsData } = useKinds({
    cluster,
    isEnabled: !!cluster,
  })

  const kindsWithVersion: readonly TKindWithVersion[] | undefined = kindsData?.kindsWithVersion

  // // 2️⃣ Load kinds for this cluster (once, cached by React state)
  // const [kindsWithVersion, setKindsWithVersion] = useState<readonly TKindWithVersion[] | undefined>(undefined)

  // useEffect(() => {
  //   let cancelled = false

  //   if (!cluster) {
  //     setKindsWithVersion(undefined)
  //     return undefined
  //   }

  //   getKinds({ cluster })
  //     .then(data => {
  //       if (cancelled) {
  //         return
  //       }
  //       setKindsWithVersion(getSortedKindsAll(data.data))
  //     })
  //     .catch(() => {
  //       // if kinds fail, we just won't enrich; base data still returned
  //       if (!cancelled) {
  //         setKindsWithVersion(undefined)
  //       }
  //     })

  //   return () => {
  //     cancelled = true
  //   }
  // }, [cluster])

  // 3️⃣ Build resolver "gvr -> kind" when kinds are available
  const resolveKindByGvr = useMemo(
    () => (kindsWithVersion ? kindByGvr(kindsWithVersion) : undefined),
    [kindsWithVersion],
  )

  // 4️⃣ Compute GVR and full apiVersion for this resource
  const gvr = useMemo(
    () => `${(apiGroup ?? '').trim()}~${(apiVersion ?? '').trim()}~${(plural ?? '').trim()}`,
    [apiGroup, apiVersion, plural],
  )

  const fullApiVersion = useMemo(() => {
    const g = (apiGroup ?? '').trim()
    const v = (apiVersion ?? '').trim()
    // core group → "v1", "v1beta1", etc.
    if (!g || g === 'core') {
      return v
    }
    // named groups → "group/version", e.g. "apps/v1"
    return `${g}/${v}`
  }, [apiGroup, apiVersion])

  // 5️⃣ Enrich data.items[*] with kind + apiVersion (if possible)
  const dataWithKinds = useMemo<TWithKindAndApiVersionOnItems<T> | undefined>(() => {
    if (!base.data) return undefined

    // If there is no items array, just pass through unchanged
    if (!hasItemsArray(base.data)) {
      return base.data as TWithKindAndApiVersionOnItems<T>
    }

    const resolvedKind = resolveKindByGvr?.(gvr)
    // Even if we don't get a kind, we can still attach apiVersion
    const shouldAddKind = Boolean(resolvedKind)

    const itemsWithKindAndApiVersion = base.data.items.map(item => {
      const typedItem = item as {
        kind?: string
        apiVersion?: string
      } & Record<string, unknown>

      return {
        ...typedItem,
        kind: typedItem.kind ?? (shouldAddKind ? resolvedKind : undefined),
        apiVersion: typedItem.apiVersion ?? fullApiVersion,
      }
    })

    return {
      ...(base.data as object),
      items: itemsWithKindAndApiVersion,
    } as TWithKindAndApiVersionOnItems<T>
  }, [base.data, resolveKindByGvr, gvr, fullApiVersion])

  // 6️⃣ Same shape as base hook, but with enriched data
  return {
    ...base,
    data: dataWithKinds,
  }
}
