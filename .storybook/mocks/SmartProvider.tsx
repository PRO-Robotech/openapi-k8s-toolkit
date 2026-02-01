import React from 'react'
import { theme as antdTheme } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { MultiQueryMockProvider, TMultiQueryValue } from './hybridDataProvider'
import { PartsOfUrlMockProvider } from './partsOfUrlContext'
import { ThemeProvider } from './themeContext'

const queryClient = new QueryClient()

export const SmartProvider: React.FC<{
  children: React.ReactNode
  multiQueryValue: Partial<TMultiQueryValue>
  partsOfUrl?: string[]
  theme?: 'light' | 'dark'
}> = ({ children, multiQueryValue, partsOfUrl, theme }) => {
  const { token } = antdTheme.useToken()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={theme}>
        <MemoryRouter>
          <MultiQueryMockProvider value={multiQueryValue}>
            <PartsOfUrlMockProvider value={{ partsOfUrl: partsOfUrl ?? [] }}>
              <div style={{ background: token.colorBgLayout }}>{children}</div>
            </PartsOfUrlMockProvider>
          </MultiQueryMockProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
