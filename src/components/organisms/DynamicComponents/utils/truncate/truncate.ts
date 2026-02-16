/* eslint-disable @typescript-eslint/no-explicit-any */

export const truncate = (text: string, max?: number): string => {
  if (!max) {
    return text
  }

  return text.length > max ? text.slice(0, max) + '...' : text
}
