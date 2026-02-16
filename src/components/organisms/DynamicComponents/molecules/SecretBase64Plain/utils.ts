export const decodeIfBase64 = (value: string, shouldDecode: boolean): string => {
  if (!shouldDecode) {
    return value
  }
  try {
    return atob(value)
  } catch (error) {
    // Keep original value to avoid runtime crashes on invalid base64.
    // eslint-disable-next-line no-console
    console.error(error)
    return value
  }
}

export const resolveMultilineRows = (value: string, multilineRows?: number): number => {
  const computedRows = Math.min(12, Math.max(3, value.split(/\r\n|\r|\n/).length))
  if (typeof multilineRows === 'number' && Number.isFinite(multilineRows)) {
    return Math.min(30, Math.max(1, Math.floor(multilineRows)))
  }
  return computedRows
}
