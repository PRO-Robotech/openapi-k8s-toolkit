/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

describe('factoryConfigProvider module', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('re-exports Provider and useTypedContext from createContextFactory', () => {
    const ProviderMock = ({ children }: { children?: React.ReactNode }) => <div data-testid="provider">{children}</div>
    const useTypedContextMock = jest.fn()

    jest.doMock('utils/createContextFactory', () => ({
      createContextFactory: jest.fn(() => ({
        Provider: ProviderMock,
        useTypedContext: useTypedContextMock,
      })),
    }))

    jest.isolateModules(() => {
      // ✅ correct relative path for this folder
      const mod = require('./factoryConfigProvider')

      expect(mod.FactoryConfigContextProvider).toBe(ProviderMock)
      expect(mod.useFactoryConfig).toBe(useTypedContextMock)
    })
  })

  test('calls through to the factory hook implementation', () => {
    const ProviderMock = ({ children }: { children?: React.ReactNode }) => <>{children}</>
    const useTypedContextMock = jest.fn(() => ({ nodeTerminalDefaultProfile: 'x' }))

    jest.doMock('utils/createContextFactory', () => ({
      createContextFactory: jest.fn(() => ({
        Provider: ProviderMock,
        useTypedContext: useTypedContextMock,
      })),
    }))

    jest.isolateModules(() => {
      const mod = require('./factoryConfigProvider')

      const result = mod.useFactoryConfig()
      expect(useTypedContextMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ nodeTerminalDefaultProfile: 'x' })
    })
  })
})
