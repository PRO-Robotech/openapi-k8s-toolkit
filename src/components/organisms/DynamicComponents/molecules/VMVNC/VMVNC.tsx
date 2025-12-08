/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { VMVNC as VNC } from 'components'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
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
    forcedFullWsPath,
    substractHeight,
    ...props
  } = data

  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterPrepared = cluster ? parseAll({ text: cluster, replaceValues, multiQueryData }) : undefined

  const namespacePrepared = namespace ? parseAll({ text: namespace, replaceValues, multiQueryData }) : undefined

  const vmNamePrepared = vmName ? parseAll({ text: vmName, replaceValues, multiQueryData }) : undefined

  const forcedFullWsPathPrepared = forcedFullWsPath
    ? parseAll({ text: forcedFullWsPath, replaceValues, multiQueryData })
    : undefined

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <>
      <VNC
        cluster={clusterPrepared}
        namespace={namespacePrepared}
        vmName={vmNamePrepared}
        forcedFullWsPath={forcedFullWsPathPrepared}
        substractHeight={substractHeight || 400}
        {...props}
      />
      {children}
    </>
  )
}
