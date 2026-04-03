import React, { createContext, useContext } from 'react'

type TErrorLike = { message: string }
export type TMultiQueryValue = {
  data: Record<string, unknown> | null
  isLoading: boolean
  isError: boolean
  errors: (TErrorLike | null | undefined)[]
  hasErrorForReq: (reqIndex: number) => boolean
  getErrorForReq: (reqIndex: number) => TErrorLike | null
}

const Ctx = createContext<TMultiQueryValue>({
  data: null,
  isLoading: false,
  isError: false,
  errors: [],
  hasErrorForReq: () => false,
  getErrorForReq: () => null,
})

export const MultiQueryMockProvider: React.FC<React.PropsWithChildren<{ value: Partial<TMultiQueryValue> }>> = ({
  value,
  children,
}) => {
  const defaultErrors = value.errors ?? []
  const merged: TMultiQueryValue = {
    data: null,
    isLoading: false,
    isError: false,
    errors: defaultErrors,
    hasErrorForReq: (reqIndex: number) => Boolean(defaultErrors[reqIndex]),
    getErrorForReq: (reqIndex: number) => defaultErrors[reqIndex] ?? null,
    ...value,
  }
  return <Ctx.Provider value={merged}>{children}</Ctx.Provider>
}

export const useMultiQuery = () => useContext(Ctx)
