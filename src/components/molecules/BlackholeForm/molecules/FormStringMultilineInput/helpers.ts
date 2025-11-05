// --- helpers ---
export const toBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text) // UTF-8 -> bytes
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export const fromBase64 = (b64: string): string => {
  if (b64 == null) return ''
  // normalize URL-safe and add padding
  let norm = b64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = norm.length % 4
  if (pad === 2) norm += '=='
  else if (pad === 3) norm += '='
  else if (pad !== 0) throw new Error('Invalid Base64 length')

  const binary = atob(norm) // bytes as binary string
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes) // bytes -> UTF-8 string
}
