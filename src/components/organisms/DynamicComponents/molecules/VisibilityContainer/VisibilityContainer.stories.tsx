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
    criteria: {
      control: { type: 'radio' },
      options: ['equals', 'notEquals', 'exists', 'notExists', null],
      mapping: {
        equals: 'equals',
        notEquals: 'notEquals',
        exists: 'exists',
        notExists: 'notExists',
        null: undefined,
      },
      description: 'data.criteria – optional comparison operator (equals / notEquals / exists / notExists)',
    },
    valueToCompare: {
      control: 'object',
      description: 'data.valueToCompare – string or array of strings to compare with resolved value',
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
      criteria: args.criteria as TInner['criteria'],
      valueToCompare: args.valueToCompare as TInner['valueToCompare'],
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
                I am visible when:
                <ul style={{ marginTop: 6 }}>
                  <li>
                    <code>value</code> resolves (not <code>~undefined-value~</code>)
                  </li>
                  <li>
                    If <code>criteria</code> is set, the comparison passes against <code>valueToCompare</code>
                  </li>
                </ul>
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
    criteria: undefined,
    valueToCompare: undefined,

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

export const CriteriaEqualsPasses: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-equals-passes',
    criteria: 'equals',
    valueToCompare: ['show'],
    value: "{reqsJsonPath[0]['.data.flag']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'show',
        },
      },
    },
  },
}

export const CriteriaEqualsFails: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-equals-fails',
    criteria: 'equals',
    valueToCompare: ['Role'],
    value: "{reqsJsonPath[0]['.data.flag']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'ClusterRole',
        },
      },
    },
  },
}

export const CriteriaNotEqualsPasses: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-not-equals-passes',
    criteria: 'notEquals',
    valueToCompare: ['Role'],
    value: "{reqsJsonPath[0]['.data.flag']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'ClusterRole',
        },
      },
    },
  },
}

export const CriteriaNotEqualsFails: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-not-equals-fails',
    criteria: 'notEquals',
    valueToCompare: ['Role'],
    value: "{reqsJsonPath[0]['.data.flag']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'Role',
        },
      },
    },
  },
}

// ========== NEW: EXISTS / NOT EXISTS CRITERIA ==========

export const CriteriaExistsPasses: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-exists-passes',
    criteria: 'exists',
    value: "{reqsJsonPath[0]['.data.flag']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'some-value',
        },
      },
    },
  },
}

export const CriteriaExistsFails: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-exists-fails',
    criteria: 'exists',
    value: "{reqsJsonPath[0]['.data.missing']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'show',
        },
      },
    },
  },
}

export const CriteriaNotExistsPasses: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-not-exists-passes',
    criteria: 'notExists',
    value: "{reqsJsonPath[0]['.data.missing']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'show',
        },
      },
    },
  },
}

export const CriteriaNotExistsFails: Story = {
  args: {
    ...Default.args,
    id: 'visibility-criteria-not-exists-fails',
    criteria: 'notExists',
    value: "{reqsJsonPath[0]['.data.flag']['-']}",
    multiQueryData: {
      req0: {
        data: {
          flag: 'some-value',
        },
      },
    },
  },
}

// ========== NEW: DYNAMIC valueToCompare WITH parseAll ==========

export const DynamicValueToCompare: Story = {
  args: {
    ...Default.args,
    id: 'visibility-dynamic-value-to-compare',
    criteria: 'equals',
    value: "{reqsJsonPath[0]['.status.phase']['-']}",
    // valueToCompare uses dynamic template from another request
    valueToCompare: ["{reqsJsonPath[1]['.data.expectedPhase']['-']}"],
    multiQueryData: {
      req0: {
        status: {
          phase: 'Running',
        },
      },
      req1: {
        data: {
          expectedPhase: 'Running',
        },
      },
    },
  },
}

export const DynamicValueToCompareWithPartsOfUrl: Story = {
  args: {
    ...Default.args,
    id: 'visibility-dynamic-value-to-compare-parts-of-url',
    criteria: 'equals',
    value: "{reqsJsonPath[0]['.metadata.namespace']['-']}",
    // valueToCompare uses URL part (e.g., {2} = cluster name from URL)
    valueToCompare: ['{2}'],
    partsOfUrl: ['', '', 'default', 'pods', 'my-pod'],
    multiQueryData: {
      req0: {
        metadata: {
          namespace: 'default',
        },
      },
    },
  },
}

// ========== NEW: CHECKING AGAINST ~undefined-value~ ==========

export const CheckAgainstUndefinedValue: Story = {
  args: {
    ...Default.args,
    id: 'visibility-check-undefined-value',
    criteria: 'equals',
    value: "{reqsJsonPath[0]['.metadata.deletionTimestamp']['-']}",
    valueToCompare: ['~undefined-value~'],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'my-resource',
          // deletionTimestamp is missing (undefined)
        },
      },
    },
  },
}

export const CheckNotUndefinedValue: Story = {
  args: {
    ...Default.args,
    id: 'visibility-check-not-undefined-value',
    criteria: 'notEquals',
    value: "{reqsJsonPath[0]['.metadata.deletionTimestamp']['-']}",
    valueToCompare: ['~undefined-value~'],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'my-resource',
          deletionTimestamp: '2024-01-01T00:00:00Z',
        },
      },
    },
  },
}
