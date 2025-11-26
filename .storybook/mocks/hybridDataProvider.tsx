import React, { createContext, useContext } from 'react'

type TErrorLike = { message: string }
export type TMultiQueryValue = {
  data: Record<string, unknown> | null
  isLoading: boolean
  isError: boolean
  errors: (TErrorLike | null | undefined)[]
}

const Ctx = createContext<TMultiQueryValue>({
  data: null,
  isLoading: false,
  isError: false,
  errors: [],
})

export const MultiQueryMockProvider: React.FC<React.PropsWithChildren<{ value: Partial<TMultiQueryValue> }>> = ({
  value,
  children,
}) => {
  const merged: TMultiQueryValue = {
    data: null,
    isLoading: false,
    isError: false,
    errors: [],
    ...value,
  }
  return <Ctx.Provider value={merged}>{children}</Ctx.Provider>
}

export const useMultiQuery = () => useContext(Ctx)
