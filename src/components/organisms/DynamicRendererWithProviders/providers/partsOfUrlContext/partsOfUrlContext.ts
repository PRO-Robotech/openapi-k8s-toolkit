import { createContextFactory } from 'utils/createContextFactory'

type TPartsOfUrl = {
  partsOfUrl: string[]
}

const partsOfUrlContext = createContextFactory<TPartsOfUrl>()

export const PartsOfUrlProvider = partsOfUrlContext.Provider
export const usePartsOfUrl = partsOfUrlContext.useTypedContext
