import { useK8sSmartResource } from './useK8sSmartResource'
import type { TUseK8sSmartResourceParams } from './useK8sSmartResourceWithoutKinds'

export const useManyK8sSmartResource = <T>(paramsList: readonly TUseK8sSmartResourceParams<T>[]) => {
  const results: ReturnType<typeof useK8sSmartResource<T>>[] = []

  // rules-of-hooks safe: fixed loop count, no conditional exits.
  for (let i = 0; i < paramsList.length; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[i] = useK8sSmartResource<T>(paramsList[i])
  }

  return results
}
