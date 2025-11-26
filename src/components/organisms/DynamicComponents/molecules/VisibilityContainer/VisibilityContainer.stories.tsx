// src/components/organisms/DynamicComponents/molecules/VisibilityContainer/VisibilityContainer.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { VisibilityContainer } from './VisibilityContainer'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['VisibilityContainer']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/VisibilityContainer',
  component: VisibilityContainer as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    value: {
      control: 'text',
      description:
        "data.value – template resolved via parseWithoutPartsOfUrl (e.g. \"{reqsJsonPath[0]['.data.flag']['-']}\")",
    },

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock multiQuery data (object with req{index} keys)',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array (not used here, but SmartProvider expects it)',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context (not used by VisibilityContainer directly)',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      value: args.value,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <VisibilityContainer data={data}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 4,
                  border: '1px dashed #aaa',
                  background: '#fafafa',
                  fontSize: 13,
                }}
              >
                I am only visible when <code>value</code> resolves to something other than{' '}
                <code>~undefined-value~</code>.
              </div>
            </VisibilityContainer>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'VisibilityContainer',
            data,
          })}
          theme="vs-dark"
          options={{
            theme: 'vs-dark',
            readOnly: true,
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
    id: 'example-visibility-container',
    // typical template used by parseWithoutPartsOfUrl
    value: "{reqsJsonPath[0]['.data.flag']['-']}",

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        data: {
          flag: 'show',
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const HiddenWhenUndefined: Story = {
  args: {
    ...Default.args,
    id: 'example-visibility-container-hidden',
    // template points to a missing path -> parseWithoutPartsOfUrl falls back to "~undefined-value~"
    value: "{reqsJsonPath[0]['.data.missing']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'show-but-used-different-path',
        },
      },
    },
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}
