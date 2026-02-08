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
    ? _.get(prefillValuesRaw || {}, pathToData)
    : jp.query(prefillValuesRaw || {}, `$${pathToData}`)[0]
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
  if (typeof prefillValues !== 'object' || prefillValues === null) {
    return prefillValues
  }

  const newValues = { ...prefillValues } as Record<string, any>

  if (forcedKind) {
    if ('kind' in newValues) {
      delete newValues.kind
    }
    if ('apiVersion' in newValues) {
      delete newValues.apiVersion
    }

    newValues.kind = forcedKind
    if (apiVersion) {
      newValues.apiVersion = `${apiGroup ? `${apiGroup}/` : ''}${apiVersion}`
    }
  }

  const orderedValues: Record<string, any> = {}
  if ('kind' in newValues) {
    orderedValues.kind = newValues.kind
  }
  if ('apiVersion' in newValues) {
    orderedValues.apiVersion = newValues.apiVersion
  }

  Object.keys(newValues).forEach(key => {
    if (key !== 'kind' && key !== 'apiVersion') {
      orderedValues[key] = newValues[key]
    }
  })

  return orderedValues
}
