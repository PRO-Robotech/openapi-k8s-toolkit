import { TOwnerReference } from './types'

export const isOwnerReference = (value: unknown): value is TOwnerReference => {
  if (!value || typeof value !== 'object') {
    return false
  }

  if (value === null) {
    return false
  }

  // Validate required string fields
  if (
    !('apiVersion' in value) ||
    typeof value.apiVersion !== 'string' ||
    !('kind' in value) ||
    typeof value.kind !== 'string' ||
    !('name' in value) ||
    typeof value.name !== 'string'
  ) {
    return false
  }

  return true
}
