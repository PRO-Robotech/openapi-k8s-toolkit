import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?|jsx?)$',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^api/(.*)$': '<rootDir>/src/api/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
    '^constants/(.*)$': '<rootDir>/src/constants/$1',
    '^localTypes/(.*)$': '<rootDir>/src/localTypes/$1',
    '^mocks/(.*)$': '<rootDir>/src/mocks/$1',
    '^pages/(.*)$': '<rootDir>/src/pages/$1',
    '^store/(.*)$': '<rootDir>/src/store/$1',
    '^templates/(.*)$': '<rootDir>/src/templates/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
  },
}

export default config
