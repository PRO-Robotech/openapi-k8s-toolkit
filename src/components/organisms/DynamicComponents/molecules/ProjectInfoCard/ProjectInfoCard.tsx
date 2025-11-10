/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { ProjectInfoCard as Card } from 'components/molecules'
import { prepareTemplate } from 'utils/prepareTemplate'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'

export const ProjectInfoCard: FC<{ data: TDynamicComponentsAppTypeMap['ProjectInfoCard']; children?: any }> = ({
  data,
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, clusterNamePartOfUrl, namespacePartOfUrl, accessGroups, ...props } = data

  const { data: multiQueryData, isError, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterName = prepareTemplate({
    template: clusterNamePartOfUrl,
    replaceValues,
  })

  const namespace = prepareTemplate({
    template: namespacePartOfUrl,
    replaceValues,
  })

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
    <Card clusterName={clusterName} namespace={namespace} accessGroups={parsedAccessGroups} {...props}>
      {children}
    </Card>
  )
}
