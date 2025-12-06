/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import {
  DesignNewLayoutProvider,
  useDesignNewLayout,
  HiddenPathsProvider,
  useHiddenPathsLayout,
  OnValuesChangeCallbackProvider,
  useOnValuesChangeCallback,
  IsTouchedPersistedProvider,
  useIsTouchedPersisted,
  useUpdateIsTouchedPersisted,
} from './context'

/* ----------------- Consumers ----------------- */

const DesignConsumer = () => {
  const v = useDesignNewLayout()
  return <div data-testid="design">{typeof v === 'undefined' ? 'undefined' : String(v)}</div>
}

const HiddenConsumer = () => {
  const v = useHiddenPathsLayout()
  return <div data-testid="hidden">{typeof v === 'undefined' ? 'undefined' : JSON.stringify(v)}</div>
}

const OnChangeConsumer = () => {
  const cb = useOnValuesChangeCallback()
  return <div data-testid="has-cb">{cb ? 'yes' : 'no'}</div>
}

const TouchedReadConsumer = () => {
  const v = useIsTouchedPersisted()
  return <div data-testid="touched">{JSON.stringify(v)}</div>
}

const TouchedUpdateConsumer = () => {
  const v = useIsTouchedPersisted()
  const set = useUpdateIsTouchedPersisted()

  return (
    <div>
      <div data-testid="touched">{JSON.stringify(v)}</div>
      <button data-testid="set-a-true" onClick={() => set(prev => ({ ...prev, a: true }))} type="button" />
      <button data-testid="replace" onClick={() => set({ z: true })} type="button" />
    </div>
  )
}

/* ----------------- Tests ----------------- */

describe('DesignNewLayoutProvider / useDesignNewLayout', () => {
  test('returns undefined by default (no provider)', () => {
    render(<DesignConsumer />)
    expect(screen.getByTestId('design')).toHaveTextContent('undefined')
  })

  test('provides true', () => {
    render(
      <DesignNewLayoutProvider value>
        <DesignConsumer />
      </DesignNewLayoutProvider>,
    )
    expect(screen.getByTestId('design')).toHaveTextContent('true')
  })

  test('provides false', () => {
    render(
      <DesignNewLayoutProvider value={false}>
        <DesignConsumer />
      </DesignNewLayoutProvider>,
    )
    expect(screen.getByTestId('design')).toHaveTextContent('false')
  })
})

describe('HiddenPathsProvider / useHiddenPathsLayout', () => {
  test('returns undefined by default (no provider)', () => {
    render(<HiddenConsumer />)
    expect(screen.getByTestId('hidden')).toHaveTextContent('undefined')
  })

  test('provides hidden paths', () => {
    const value = [
      ['a', 'b'],
      ['x', 'y', 'z'],
    ]

    render(
      <HiddenPathsProvider value={value}>
        <HiddenConsumer />
      </HiddenPathsProvider>,
    )

    expect(screen.getByTestId('hidden')).toHaveTextContent(JSON.stringify(value))
  })
})

describe('OnValuesChangeCallbackProvider / useOnValuesChangeCallback', () => {
  test('returns undefined by default (no provider)', () => {
    render(<OnChangeConsumer />)
    expect(screen.getByTestId('has-cb')).toHaveTextContent('no')
  })

  test('provides callback', () => {
    const cb = jest.fn()

    render(
      <OnValuesChangeCallbackProvider value={cb}>
        <OnChangeConsumer />
      </OnValuesChangeCallbackProvider>,
    )

    expect(screen.getByTestId('has-cb')).toHaveTextContent('yes')
  })
})

describe('IsTouchedPersistedProvider / useIsTouchedPersisted / useUpdateIsTouchedPersisted', () => {
  test('useIsTouchedPersisted defaults to empty object outside provider', () => {
    render(<TouchedReadConsumer />)
    expect(screen.getByTestId('touched')).toHaveTextContent('{}')
  })

  test('initializes state from value', () => {
    render(
      <IsTouchedPersistedProvider value={{ a: false, b: true }}>
        <TouchedReadConsumer />
      </IsTouchedPersistedProvider>,
    )

    expect(screen.getByTestId('touched')).toHaveTextContent('{"a":false,"b":true}')
  })

  test('allows updates through dispatch hook', () => {
    render(
      <IsTouchedPersistedProvider value={{ a: false }}>
        <TouchedUpdateConsumer />
      </IsTouchedPersistedProvider>,
    )

    expect(screen.getByTestId('touched')).toHaveTextContent('{"a":false}')

    fireEvent.click(screen.getByTestId('set-a-true'))
    expect(screen.getByTestId('touched')).toHaveTextContent('{"a":true}')

    fireEvent.click(screen.getByTestId('replace'))
    expect(screen.getByTestId('touched')).toHaveTextContent('{"z":true}')
  })

  test('useUpdateIsTouchedPersisted throws outside provider', () => {
    const Spy = () => {
      useUpdateIsTouchedPersisted()
      return null
    }

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Spy />)).toThrow(
      'useUpdateIsTouchedPersisted must be used within a IsTouchedPersistedProvider',
    )

    consoleErrorSpy.mockRestore()
  })
})
