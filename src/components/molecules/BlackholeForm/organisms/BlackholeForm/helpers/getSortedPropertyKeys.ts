import { TFormName } from 'localTypes/form'
import { TFormSchemaProperties } from 'localTypes/formSchema'

// Function to sort properties based on sortPaths
export const getSortedPropertyKeys = ({
  name,
  sortPaths,
  properties,
}: {
  name: TFormName
  sortPaths?: string[][]
  properties: TFormSchemaProperties
}): (keyof typeof properties)[] => {
  if (!sortPaths || sortPaths.length === 0) {
    return Object.keys(properties) as (keyof typeof properties)[]
  }

  const currentPath = Array.isArray(name) ? name : [name]
  const currentPathStr = JSON.stringify(currentPath)

  // Find sort order for current path
  const currentSortPaths = sortPaths.filter(path => {
    // For root level (empty array), match paths with single element
    if (currentPath.length === 0) {
      return path.length === 1
    }

    // For nested levels, match parent path
    const pathStr = JSON.stringify(path.slice(0, -1)) // Remove last element to match parent path
    return pathStr === currentPathStr
  })

  if (currentSortPaths.length === 0) {
    return Object.keys(properties) as (keyof typeof properties)[]
  }

  // Create sort order map
  const sortOrder = new Map<string, number>()
  currentSortPaths.forEach((path, index) => {
    // For root level, use the first element as key
    // For nested levels, use the last element as key
    const key = currentPath.length === 0 ? path[0] : path[path.length - 1]
    sortOrder.set(key, index)
  })

  // Sort properties based on sort order
  return Object.keys(properties).sort((a, b) => {
    const aOrder = sortOrder.get(a) ?? Number.MAX_SAFE_INTEGER
    const bOrder = sortOrder.get(b) ?? Number.MAX_SAFE_INTEGER
    return aOrder - bOrder
  }) as (keyof typeof properties)[]
}
