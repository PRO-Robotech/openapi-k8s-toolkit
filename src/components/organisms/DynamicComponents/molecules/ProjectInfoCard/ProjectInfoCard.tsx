/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { ProjectInfoCard as Card } from 'components/molecules'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { PerRequestError } from '../PerRequestError'

export const ProjectInfoCard: FC<{ data: TDynamicComponentsAppTypeMap['ProjectInfoCard']; children?: any }> = ({
  data,
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, cluster, namespace, accessGroups, ...props } = data

  const { data: multiQueryData } = useMultiQuery()
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

  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  return (
    <Card cluster={clusterPrepared} namespace={namespacePrepared} accessGroups={parsedAccessGroups} {...props}>
      {children}
    </Card>
  )
}
