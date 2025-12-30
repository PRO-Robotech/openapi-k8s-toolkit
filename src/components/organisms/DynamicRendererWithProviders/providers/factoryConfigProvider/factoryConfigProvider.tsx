import { createContextFactory } from 'utils/createContextFactory'

type TFactoryConfig = {
  nodeTerminalDefaultProfile?: string
}

const factoryConfigContext = createContextFactory<TFactoryConfig>()

export const FactoryConfigContextProvider = factoryConfigContext.Provider
export const useFactoryConfig = factoryConfigContext.useTypedContext
