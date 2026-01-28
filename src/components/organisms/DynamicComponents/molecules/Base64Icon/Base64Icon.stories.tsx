/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Base64Icon } from './Base64Icon'
import type { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['Base64Icon']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const DEFAULT_ICON_BASE64 =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMTk1M18yNDAzNCkiPjxwYXRoIGQ9Ik0yMy40MTEgMTAuNTcxN0wyMi42MTgxIDIuMTk4NDRDMjIuNTc3OSAxLjc2NDUxIDIyLjIzMjQgMS40MjE2NSAyMS43OTg1IDEuMzc4NzlMMTMuNDI1MiAwLjU4NTkzOEgxMy40MTQ1QzEzLjMyODggMC41ODU5MzggMTMuMjYxOCAwLjYxMjcyMyAxMy4yMTEgMC42NjM2MTZMMC42NjcyIDEzLjIwNzRDMC42NDIzNjkgMTMuMjMyMSAwLjYyMjY2OSAxMy4yNjE2IDAuNjA5MjI3IDEzLjI5NEMwLjU5NTc4NiAxMy4zMjY0IDAuNTg4ODY3IDEzLjM2MTEgMC41ODg4NjcgMTMuMzk2MkMwLjU4ODg2NyAxMy40MzEzIDAuNTk1Nzg2IDEzLjQ2NiAwLjYwOTIyNyAxMy40OTg0QzAuNjIyNjY5IDEzLjUzMDggMC42NDIzNjkgMTMuNTYwMyAwLjY2NzIgMTMuNTg1TDEwLjQxMTggMjMuMzI5N0MxMC40NjI3IDIzLjM4MDYgMTAuNTI5NyAyMy40MDc0IDEwLjYwMiAyMy40MDc0QzEwLjY3NDMgMjMuNDA3NCAxMC43NDEzIDIzLjM4MDYgMTAuNzkyMiAyMy4zMjk3TDIzLjMzNiAxMC43ODU5QzIzLjM4OTUgMTAuNzI5NyAyMy40MTYzIDEwLjY1MiAyMy40MTEgMTAuNTcxN1pNMTAuNTk5MyAyMC42NDA0TDMuMzU2NDkgMTMuMzk3NUwxNC4wNjI3IDIuNjkxM0wyMC42Nzg4IDMuMzE4MDhMMjEuMzA1NiA5LjkzNDE1TDEwLjU5OTMgMjAuNjQwNFpNMTYuNTAwMiA1LjEzOTUxQzE1LjIwMTEgNS4xMzk1MSAxNC4xNDMxIDYuMTk3NTUgMTQuMTQzMSA3LjQ5NjY1QzE0LjE0MzEgOC43OTU3NiAxNS4yMDExIDkuODUzOCAxNi41MDAyIDkuODUzOEMxNy43OTkzIDkuODUzOCAxOC44NTc0IDguNzk1NzYgMTguODU3NCA3LjQ5NjY1QzE4Ljg1NzQgNi4xOTc1NSAxNy43OTkzIDUuMTM5NTEgMTYuNTAwMiA1LjEzOTUxWk0xNi41MDAyIDguMzUzOEMxNi4wMjYxIDguMzUzOCAxNS42NDMxIDcuOTcwNzYgMTUuNjQzMSA3LjQ5NjY1QzE1LjY0MzEgNy4wMjI1NSAxNi4wMjYxIDYuNjM5NTEgMTYuNTAwMiA2LjYzOTUxQzE2Ljk3NDMgNi42Mzk1MSAxNy4zNTc0IDcuMDIyNTUgMTcuMzU3NCA3LjQ5NjY1QzE3LjM1NzQgNy45NzA3NiAxNi45NzQzIDguMzUzOCAxNi41MDAyIDguMzUzOFoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvZz48ZGVmcz48Y2xpcFBhdGggaWQ9ImNsaXAwXzE5NTNfMjQwMzQiPjxyZWN0IHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0id2hpdGUiLz48L2NsaXBQYXRoPjwvZGVmcz48L3N2Zz4='

const meta: Meta<TArgs> = {
  title: 'Factory/Base64Icon',
  component: Base64Icon as any,

  argTypes: {
    // data.*
    id: {
      control: 'text',
      description: 'data.id (Dynamic Renderer id)',
    },
    base64Icon: {
      control: 'text',
      description:
        'data.base64Icon (base64-encoded SVG string; rendered via dangerouslySetInnerHTML; supports {token.colorText})',
    },
    containerStyle: {
      control: 'object',
      description: 'data.containerStyle (style applied to the wrapping div)',
    },

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into MultiQuery context',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array (used by parseAll placeholders like {0}, {1}, ... if relevant)',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context (also affects antd token colorText)',
    },
  },

  render: args => {
    const { isLoading, multiQueryData, partsOfUrl, theme, ...rest } = args

    const data: TInner = {
      id: rest.id,
      base64Icon: rest.base64Icon,
      containerStyle: rest.containerStyle,
    }

    return (
      <>
        <SmartProvider multiQueryValue={{ data: multiQueryData, isLoading }} partsOfUrl={partsOfUrl} theme={theme}>
          <div style={{ padding: 16 }}>
            <Base64Icon data={data}>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>(child content)</span>
            </Base64Icon>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={240}
          value={yaml.stringify({
            type: 'Base64Icon',
            data,
          })}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
          }}
        />
      </>
    )
  },

  parameters: {
    controls: { expanded: true },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-base64-icon',
    base64Icon: DEFAULT_ICON_BASE64,
    containerStyle: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    } as any,

    // providers
    isLoading: false,
    multiQueryData: null,
    partsOfUrl: [],
    theme: 'light',
  },
}

export const TokenColor: Story = {
  args: {
    ...Default.args,
    id: 'example-base64-icon-dark',
    theme: 'dark',
    containerStyle: {
      color: 'token.colorSuccess',
    } as any,
  },
}

export const DarkTheme: Story = {
  args: {
    ...Default.args,
    id: 'example-base64-icon-dark',
    theme: 'dark',
  },
}

export const LargerIcon: Story = {
  args: {
    ...Default.args,
    id: 'example-base64-icon-large',
    // Change SVG size by editing width/height in the decoded SVG.
    // Easiest knob is container CSS scaling:
    containerStyle: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      transform: 'scale(1.5)',
      transformOrigin: 'top left',
    } as any,
  },
}

export const InvalidBase64: Story = {
  args: {
    ...Default.args,
    id: 'example-base64-icon-invalid',
    base64Icon: 'not-base64',
  },
}
