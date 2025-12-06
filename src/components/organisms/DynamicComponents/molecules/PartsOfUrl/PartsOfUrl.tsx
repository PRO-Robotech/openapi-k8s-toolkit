import React, { FC } from 'react'
import { prepareTemplate } from 'utils/prepareTemplate'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'

export const PartsOfUrl: FC<{ data: TDynamicComponentsAppTypeMap['partsOfUrl'] }> = ({ data }) => {
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const preparedText = prepareTemplate({
    template: data.text,
    replaceValues,
  })

  return <span>{preparedText}</span>
}
