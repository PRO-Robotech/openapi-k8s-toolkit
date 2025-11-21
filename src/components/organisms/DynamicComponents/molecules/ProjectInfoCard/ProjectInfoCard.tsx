/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { ProjectInfoCard as Card } from 'components/molecules'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'

export const ProjectInfoCard: FC<{ data: TDynamicComponentsAppTypeMap['ProjectInfoCard']; children?: any }> = ({
  data,
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, cluster, namespace, accessGroups, ...props } = data

  const { data: multiQueryData, isError, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })

  const namespacePrepared = parseAll({ text: namespace, replaceValues, multiQueryData })

  const parsedAccessGroups = accessGroups.map(accessGroup =>
    parseAll({ text: accessGroup, replaceValues, multiQueryData }),
  )

  if (isError) {
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
    )
  }

  return (
    <Card cluster={clusterPrepared} namespace={namespacePrepared} accessGroups={parsedAccessGroups} {...props}>
      {children}
    </Card>
  )
}
