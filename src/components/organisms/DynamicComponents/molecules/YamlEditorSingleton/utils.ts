/* eslint-disable @typescript-eslint/no-explicit-any */
import jp from 'jsonpath'
import _ from 'lodash'

export const getDataByPath = ({
  prefillValuesRaw,
  pathToData,
}: {
  prefillValuesRaw: unknown
  pathToData: string | string[]
}): any => {
  return Array.isArray(pathToData)
    ? _.get(prefillValuesRaw, pathToData)
    : jp.query(prefillValuesRaw, `$${pathToData}`)[0]
}

export const getPrefillValuesWithForces = ({
  prefillValues,
  forcedKind,
  apiGroup,
  apiVersion,
}: {
  prefillValues: any
  forcedKind?: string
  apiVersion?: string
  apiGroup?: string
}): any => {
  if (!forcedKind) {
    return prefillValues
  }

  const newValues = { ...prefillValues }

  if (typeof newValues === 'object' && newValues !== null) {
    if ('kind' in newValues) {
      delete newValues.kind
    }
    if ('apiVersion' in newValues) {
      delete newValues.apiVersion
    }
  }

  return {
    kind: forcedKind,
    apiVersion: `${apiGroup ? `${apiGroup}/` : ''}${apiVersion}`,
    ...newValues,
  }
}
