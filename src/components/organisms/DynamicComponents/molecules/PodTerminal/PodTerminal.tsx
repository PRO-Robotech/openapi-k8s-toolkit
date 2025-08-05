/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Flex, Spin } from 'antd'
import { PodTerminal as Terminal } from 'components'
import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/multiQueryProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'
import { getRunningContainerNames } from './utils'

export const PodTerminal: FC<{ data: TDynamicComponentsAppTypeMap['PodTerminal']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    cluster,
    namespace,
    podName,
    substractHeight,
    ...props
  } = data

  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })

  const namespacePrepared = parseAll({ text: namespace, replaceValues, multiQueryData })

  const podNamePrepared = parseAll({ text: podName, replaceValues, multiQueryData })

  const {
    data: podInfo,
    isError: isPodInfoError,
    isLoading: isLoadingPodInfo,
  } = useDirectUnknownResource<
    unknown & {
      status: unknown & { containerStatuses: { name: string; state?: unknown & { running?: unknown } }[] }
    }
  >({
    uri: `/api/clusters/${clusterPrepared}/k8s/api/v1/namespaces/${namespacePrepared}/pods/${podNamePrepared}`,
    refetchInterval: 5000,
    queryKey: [clusterPrepared || 'no-cluster', 'pods', podNamePrepared],
    isEnabled: clusterPrepared !== undefined && namespacePrepared !== undefined && podNamePrepared !== undefined,
  })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  if (isLoadingPodInfo) {
    return (
      <Flex justify="center">
        <Spin />
      </Flex>
    )
  }

  if (isPodInfoError) {
    return <div>Error: {JSON.stringify(isPodInfoError)}</div>
  }

  if (!podInfo) {
    return <>No Pod Info</>
  }

  const containers = getRunningContainerNames(podInfo)

  return (
    <>
      <Terminal
        cluster={clusterPrepared}
        namespace={namespacePrepared}
        podName={podNamePrepared}
        containers={containers}
        substractHeight={substractHeight || 340}
        {...props}
      />
      {children}
    </>
  )
}
