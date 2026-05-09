/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Flex, Spin } from 'antd'
import { PodTerminal as Terminal } from 'components'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
// import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { useAutoPerRequestError } from '../hooks/useAutoPerRequestError'
import { PerRequestError } from '../PerRequestError'
import { getRunningContainerNames } from './utils'

export const PodTerminal: FC<{ data: TDynamicComponentsAppTypeMap['PodTerminal']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()
  const { shouldShowError, errorToShow } = useAutoPerRequestError(data)

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    cluster,
    namespace,
    podName,
    containerName,
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

  const containerNamePrepared = containerName
    ? parseAll({ text: containerName, replaceValues, multiQueryData })
    : undefined

  // const {
  //   data: podInfo,
  //   isError: isPodInfoError,
  //   isLoading: isLoadingPodInfo,
  // } = useDirectUnknownResource<
  //   unknown & {
  //     status: unknown & { containerStatuses: { name: string; state?: unknown & { running?: unknown } }[] }
  //   }
  // >({
  //   uri: `/api/clusters/${clusterPrepared}/k8s/api/v1/namespaces/${namespacePrepared}/pods/${podNamePrepared}`,
  //   refetchInterval: 5000,
  //   queryKey: [clusterPrepared || 'no-cluster', 'pods', podNamePrepared],
  //   isEnabled: clusterPrepared !== undefined && namespacePrepared !== undefined && podNamePrepared !== undefined,
  // })

  const {
    data: podInfoList,
    isError: isPodInfoError,
    isLoading: isLoadingPodInfo,
  } = useK8sSmartResource<{
    items?: (unknown & {
      status: unknown & { containerStatuses: { name: string; state?: unknown & { running?: unknown } }[] }
    })[]
  }>({
    cluster: clusterPrepared,
    namespace: namespacePrepared,
    apiVersion: 'v1',
    plural: 'pods',
    fieldSelector: `metadata.name=${podNamePrepared}`,
    isEnabled: clusterPrepared !== undefined && namespacePrepared !== undefined && podNamePrepared !== undefined,
  })

  const podInfo = podInfoList?.items && podInfoList.items.length > 0 ? podInfoList.items[0] : undefined

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
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
        containerName={containerNamePrepared}
        containers={containers}
        substractHeight={substractHeight || 340}
        {...props}
      />
      {children}
    </>
  )
}
