import React, { createContext, useContext } from 'react'

export type TNamespaceLabels = {
  label?: string
  placeholder?: string
  allLabel?: string
  choosePlaceholder?: string
  selectPlaceholder?: string
}

type TFactoryConfig = {
  nodeTerminalDefaultProfile?: string
  namespaceLabels?: TNamespaceLabels
}

const FactoryConfigContext = createContext<TFactoryConfig>({})

export const FactoryConfigContextProvider = ({
  children,
  value,
}: React.PropsWithChildren<{ value: TFactoryConfig }>) => {
  return <FactoryConfigContext.Provider value={value}>{children}</FactoryConfigContext.Provider>
}

export const useFactoryConfig = () => useContext(FactoryConfigContext)
