/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { NodeTerminal as Terminal } from 'components'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/multiQueryProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { useFactoryConfig } from '../../../DynamicRendererWithProviders/factoryConfigProvider'
import { parseAll } from '../utils'

export const NodeTerminal: FC<{ data: TDynamicComponentsAppTypeMap['NodeTerminal']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    cluster,
    nodeName,
    substractHeight,
    ...props
  } = data

  const { nodeTerminalDefaultProfile } = useFactoryConfig()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })

  const nodeNamePrepared = parseAll({ text: nodeName, replaceValues, multiQueryData })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <>
      <Terminal
        cluster={clusterPrepared}
        nodeName={nodeNamePrepared}
        substractHeight={substractHeight || 340}
        defaultProfile={nodeTerminalDefaultProfile}
        {...props}
      />
      {children}
    </>
  )
}
