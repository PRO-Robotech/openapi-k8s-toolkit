/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DynamicRenderer } from './DynamicRenderer'

// Helper leaf component
const Leaf = jest.fn(({ data }: any) => {
  return <span data-testid={`leaf-${data.id ?? 'x'}`}>{data.label ?? 'LEAF'}</span>
})

// Simple parent that renders children prop
const Parent = jest.fn(({ data, children }: any) => {
  return (
    <div data-testid={`parent-${data.id ?? 'x'}`}>
      <span>{data.label ?? 'PARENT'}</span>
      <div data-testid="parent-children">{children}</div>
    </div>
  )
})

// List-like component that renders data.items and their children (if any)
const List = jest.fn(({ data }: any) => {
  return (
    <div data-testid="list">
      {(data.items ?? []).map((it: any, idx: number) => (
        <div key={idx} data-testid={`list-item-${idx}`}>
          <span data-testid={`list-item-label-${idx}`}>{it.label ?? `item-${idx}`}</span>
          {/* Critically render children from data.items so we can verify wrapping */}
          <div data-testid={`list-item-children-${idx}`}>{it.children ?? null}</div>
        </div>
      ))}
    </div>
  )
})

// Component that just prints primitive-ish data for verification
const Echo = jest.fn(({ data }: any) => {
  return <div data-testid="echo">{String(data)}</div>
})

describe('DynamicRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders fallback message when no component registered for type', () => {
    render(<DynamicRenderer items={[{ type: 'unknown', data: {} } as any]} components={{} as any} />)

    expect(screen.getByText('❌ No component registered for type: unknown')).toBeInTheDocument()
  })

  test('renders component and recursively renders item.children as children prop', () => {
    const items = [
      {
        type: 'parent',
        data: { id: 'p1', label: 'Parent 1' },
        children: [{ type: 'leaf', data: { id: 'c1', label: 'Child 1' } }],
      },
    ] as any[]

    const components = {
      parent: Parent,
      leaf: Leaf,
    } as any

    render(<DynamicRenderer items={items} components={components} />)

    expect(screen.getByTestId('parent-p1')).toBeInTheDocument()
    expect(screen.getByText('Parent 1')).toBeInTheDocument()

    // child rendered via children prop recursion
    expect(screen.getByTestId('leaf-c1')).toBeInTheDocument()
    expect(screen.getByText('Child 1')).toBeInTheDocument()

    expect(Parent).toHaveBeenCalledTimes(1)
    expect(Leaf).toHaveBeenCalledTimes(1)
  })

  test('wraps child.children array found inside item.data.items with DynamicRendererInner', () => {
    const items = [
      {
        type: 'list',
        data: {
          items: [
            {
              label: 'Item A',
              children: [{ type: 'leaf', data: { id: 'a1', label: 'Leaf A1' } }],
            },
            {
              label: 'Item B',
              // not an array -> should pass through as-is
              children: <span data-testid="static-child">STATIC</span>,
            },
          ],
        },
      },
    ] as any[]

    const components = {
      list: List,
      leaf: Leaf,
    } as any

    render(<DynamicRenderer items={items} components={components} />)

    // list rendered
    expect(screen.getByTestId('list')).toBeInTheDocument()

    // item labels
    expect(screen.getByText('Item A')).toBeInTheDocument()
    expect(screen.getByText('Item B')).toBeInTheDocument()

    // Item A children array should be wrapped and thus rendered as Leaf component
    expect(screen.getByTestId('leaf-a1')).toBeInTheDocument()
    expect(screen.getByText('Leaf A1')).toBeInTheDocument()

    // Item B children was a React element, should be preserved
    expect(screen.getByTestId('static-child')).toBeInTheDocument()
    expect(screen.getByText('STATIC')).toBeInTheDocument()

    expect(List).toHaveBeenCalledTimes(1)
    expect(Leaf).toHaveBeenCalledTimes(1)
  })

  test('does not attempt to modify data when item.data is not an object with items array', () => {
    const items = [
      { type: 'echo', data: 'hello' },
      { type: 'echo', data: 123 },
      { type: 'echo', data: null },
    ] as any[]

    const components = {
      echo: Echo,
    } as any

    render(<DynamicRenderer items={items} components={components} />)

    // We render three Echo components; each prints String(data)
    const echoes = screen.getAllByTestId('echo')
    expect(echoes).toHaveLength(3)
    expect(echoes[0]).toHaveTextContent('hello')
    expect(echoes[1]).toHaveTextContent('123')
    expect(echoes[2]).toHaveTextContent('null')

    expect(Echo).toHaveBeenCalledTimes(3)
  })

  test('handles mixed nesting: item.children + data.items children together', () => {
    const items = [
      {
        type: 'parent',
        data: { id: 'p2', label: 'Parent 2' },
        children: [
          {
            type: 'list',
            data: {
              items: [
                {
                  label: 'Nested Item',
                  children: [{ type: 'leaf', data: { id: 'nx', label: 'Nested Leaf' } }],
                },
              ],
            },
          },
        ],
      },
    ] as any[]

    const components = {
      parent: Parent,
      list: List,
      leaf: Leaf,
    } as any

    render(<DynamicRenderer items={items} components={components} />)

    expect(screen.getByTestId('parent-p2')).toBeInTheDocument()
    expect(screen.getByText('Parent 2')).toBeInTheDocument()

    expect(screen.getByTestId('list')).toBeInTheDocument()
    expect(screen.getByText('Nested Item')).toBeInTheDocument()
    expect(screen.getByTestId('leaf-nx')).toBeInTheDocument()
    expect(screen.getByText('Nested Leaf')).toBeInTheDocument()
  })
})
