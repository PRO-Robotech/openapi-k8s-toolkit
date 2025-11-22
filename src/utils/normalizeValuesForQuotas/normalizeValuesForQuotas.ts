/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash'
import { OpenAPIV2 } from 'openapi-types'
import { parseQuotaValueCpu, parseQuotaValueMemoryAndStorage } from 'utils/parseForQuotaValues'

type Path = (string | number)[]

const findAllPathsForObject = (obj: any, targetKey: string, targetValue: any, currentPath: Path = []): Path[] => {
  let paths: Path[] = []

  if (typeof obj !== 'object' || obj === null) {
    return paths
  }

  // If the current object matches the condition, add the current path to the results
  if (obj[targetKey] === targetValue) {
    paths.push([...currentPath])
  }

  // Iterate through the keys of the object
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]

      // If the value is an object or array, recurse
      if (typeof value === 'object' && value !== null) {
        const newPath = [...currentPath, key]
        const subPaths = findAllPathsForObject(value, targetKey, targetValue, newPath)
        paths = paths.concat(subPaths) // Add the sub-paths to the result
      }
    }
  }

  return paths
}

export const normalizeValuesForQuotasToNumber = (object: any, properties: OpenAPIV2.SchemaObject['properties']) => {
  const newObject = _.cloneDeep(object)
  const cpuPaths = findAllPathsForObject(properties, 'type', 'rangeInputCpu')
  const memoryPaths = findAllPathsForObject(properties, 'type', 'rangeInputMemory')

  memoryPaths.forEach(path => {
    const cleanPath = path.filter(el => typeof el === 'string').filter(el => el !== 'properties')
    const value = _.get(newObject || {}, cleanPath)
    if (value || value === 0) {
      _.set(newObject, cleanPath, parseQuotaValueMemoryAndStorage(value))
    }
  })

  cpuPaths.forEach(path => {
    const cleanPath = path.filter(el => typeof el === 'string').filter(el => el !== 'properties')
    const value = _.get(newObject || {}, cleanPath)
    if (value || value === 0) {
      _.set(newObject, cleanPath, parseQuotaValueCpu(value))
    }
  })

  return newObject
}
