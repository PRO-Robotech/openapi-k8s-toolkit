/* eslint-disable @typescript-eslint/no-explicit-any */
export const renderIcon = (customLogo: string, colorText: string): JSX.Element | null => {
  if (customLogo) {
    // Decode base64 SVG and replace all fill placeholders
    try {
      const decodedSvg = atob(customLogo)
      // Replace all instances of {token.colorText} with actual color
      const svgWithFill = decodedSvg.replace(/\{token\.colorText\}/g, `"${colorText}"`)
      // eslint-disable-next-line react/no-danger
      return <div dangerouslySetInnerHTML={{ __html: svgWithFill }} />
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error decoding custom logo:', error)
      return null
    }
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolveTokenColor = (value: unknown, token: Record<string, any>) => {
  if (typeof value !== 'string') return value
  if (!value.startsWith('token.')) return value

  const tokenKey = value.replace('token.', '')
  return token[tokenKey] ?? value
}

export const resolveTokenStyle = (
  style: React.CSSProperties | undefined,
  token: Record<string, any>,
): React.CSSProperties | undefined => {
  if (!style) return style

  const next: Record<string, any> = { ...style }

  // eslint-disable-next-line no-restricted-syntax
  for (const [k, v] of Object.entries(next)) {
    // Only resolving direct string values (typical for CSSProperties)
    next[k] = resolveTokenColor(v, token)
  }

  return next as React.CSSProperties
}
