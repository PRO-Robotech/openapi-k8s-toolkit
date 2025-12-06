import React, { FC, createContext, useContext, ReactNode } from 'react'

const ThemeContext = createContext<'dark' | 'light'>('dark')

type TThemeProviderProps = {
  theme: 'light' | 'dark'
  children: ReactNode
}

export const ThemeProvider: FC<TThemeProviderProps> = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
)

export const useTheme = (): 'dark' | 'light' => {
  return useContext(ThemeContext)
}
