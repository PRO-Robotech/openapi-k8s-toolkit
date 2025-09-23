/**
 * Determines if a string should be treated as multiline in YAML
 * @param value - The string value to check
 * @returns true if the string should be multiline, false otherwise
 */
export const isMultilineString = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false
  }

  // Check if string contains newlines
  if (value.includes('\n')) {
    return true
  }

  // Check if string is very long (more than 80 characters)
  if (value.length > 80) {
    return true
  }

  // Check if string contains special characters that suggest multiline content
  const multilineIndicators = [
    '#cloud-config',
    '#!/',
    '---',
    '```',
    'BEGIN',
    'END',
    '-----BEGIN',
    '-----END',
  ]

  return multilineIndicators.some(indicator => value.includes(indicator))
}

/**
 * Determines if a string should be treated as multiline based on YAML content
 * @param yamlContent - The YAML content to analyze
 * @param fieldPath - The path to the field in the YAML
 * @returns true if the field should be multiline, false otherwise
 */
export const isMultilineFromYaml = (yamlContent: string, fieldPath: string[]): boolean => {
  if (!yamlContent || !fieldPath.length) {
    return false
  }

  try {
    // Look for multiline indicators in the YAML content
    const lines = yamlContent.split('\n')
    const fieldName = fieldPath[fieldPath.length - 1]
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check if this line contains our field
      if (line.includes(`${fieldName}:`) && line.includes('|')) {
        return true
      }
      
      // Check if this line contains our field with literal block scalar
      if (line.includes(`${fieldName}:`) && line.includes('>')) {
        return true
      }
    }
    
    return false
  } catch {
    return false
  }
}
