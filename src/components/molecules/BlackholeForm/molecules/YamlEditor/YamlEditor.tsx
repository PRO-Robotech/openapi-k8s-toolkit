/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-nested-ternary */
import React, { FC, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { isMultilineString } from 'utils/isMultilineString'
import { Styled } from './styled'

type TYamlEditProps = {
  theme: 'light' | 'dark'
  currentValues: Record<any, unknown>
  onChange: (values: Record<string, unknown>) => void
}

// Function to process values and format multiline strings properly
const processValuesForYaml = (values: any): any => {
  if (Array.isArray(values)) {
    return values.map(processValuesForYaml)
  }
  
  if (values && typeof values === 'object') {
    const processed: any = {}
    for (const [key, value] of Object.entries(values)) {
      processed[key] = processValuesForYaml(value)
    }
    return processed
  }
  
  return values
}

export const YamlEditor: FC<TYamlEditProps> = ({ theme, currentValues, onChange }) => {
  const [yamlData, setYamlData] = useState<string>('')

  useEffect(() => {
    const yamlString = yaml.stringify(currentValues, {
      // Use literal block scalar for multiline strings
      blockQuote: 'literal',
      // Preserve line breaks
      lineWidth: 0,
      // Use double quotes for strings that need escaping
      doubleQuotedAsJSON: false,
    })
    setYamlData(yamlString)
  }, [currentValues])

  return (
    <Styled.BorderRadiusContainer>
      <Editor
        defaultLanguage="yaml"
        width="100%"
        height="100%"
        value={yamlData}
        onChange={value => {
          onChange(yaml.parse(value || ''))
          setYamlData(value || '')
        }}
        theme={theme === 'dark' ? 'vs-dark' : theme === undefined ? 'vs-dark' : 'vs'}
        options={{
          theme: theme === 'dark' ? 'vs-dark' : theme === undefined ? 'vs-dark' : 'vs',
        }}
      />
    </Styled.BorderRadiusContainer>
  )
}
