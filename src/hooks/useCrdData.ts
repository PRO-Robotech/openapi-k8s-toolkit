import { useQuery } from '@tanstack/react-query'
import { getCrdData } from 'api/getCrdData'
import { TCRD } from 'localTypes/k8s'

/* /apis/apiextensions.k8s.io/${apiExtensionVersion}/customresourcedefinitions/${crdName} */
export const useCrdData = ({
  clusterName,
  apiExtensionVersion,
  crdName,
}: {
  clusterName: string
  apiExtensionVersion: string
  crdName: string
}) => {
  return useQuery({
    queryKey: ['useCrdData', clusterName, apiExtensionVersion, crdName],
    queryFn: async () => {
      const response = await getCrdData<TCRD>({
        clusterName,
        apiExtensionVersion,
        crdName,
      })
      // Deep clone the data (to avoid mutating the original response)
      const data = JSON.parse(JSON.stringify(response.data))
      // Remove deeply nested field
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion
      }
      return data as TCRD
    },
    refetchInterval: 5000,
  })
}
