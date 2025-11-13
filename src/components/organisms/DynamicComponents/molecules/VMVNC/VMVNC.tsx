/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Flex, Spin } from 'antd'
import { VMVNC as VNC } from 'components'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/multiQueryProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'

export const VMVNC: FC<{ data: TDynamicComponentsAppTypeMap['VMVNC']; children?: any }> = ({
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
    vmName,
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

  const vmNamePrepared = parseAll({ text: vmName, replaceValues, multiQueryData })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  if (!clusterPrepared || !namespacePrepared || !vmNamePrepared) {
    return (
      <Flex justify="center">
        <Spin />
      </Flex>
    )
  }

  return (
    <>
      <VNC
        cluster={clusterPrepared}
        namespace={namespacePrepared}
        vmName={vmNamePrepared}
        substractHeight={substractHeight || 400}
        {...props}
      />
      {children}
    </>
  )
}

