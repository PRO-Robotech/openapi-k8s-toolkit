import type { Meta, StoryObj } from '@storybook/react'
import React, { CSSProperties } from 'react'
import { FlexProps } from 'antd'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { SecretBase64Plain } from './SecretBase64Plain'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['SecretBase64Plain']

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/SecretBase64Plain',
  component: SecretBase64Plain as any,
  // Expose *inner* fields as top-level controls
  argTypes: {
    id: { control: 'text', description: 'data.id' },
    type: { options: ['base64', 'plain'], control: { type: 'radio' }, description: 'data.type' },
    value: { control: 'text', description: 'data.value' },
    reqIndex: { control: 'text', description: 'data.reqIndex' },
    jsonPathToSecrets: { control: 'text', description: 'data.jsonPathToSecrets' },
    multiline: { control: 'boolean', description: 'data.multiline' },
    multilineRows: { control: 'number', description: 'data.multilineRows' },
    textStyle: { control: 'object', description: 'data.textStyle' },
    emptyText: { control: 'text', description: 'data.emptyText' },
    containerStyle: { control: 'object', description: 'data.containerStyle' },
    inputContainerStyle: { control: 'object', description: 'data.inputContainerStyle' },
    flexProps: { control: 'object', description: 'data.flexProps' },
    niceLooking: { control: 'boolean' },
    notificationWidth: { control: 'text', description: 'data.notificationWidth' },
    notificationText: { control: 'text', description: 'data.notificationText' },

    // provider knobs
    isLoading: { control: 'boolean' },
    isError: { control: 'boolean' },
    errors: { control: 'object' },
    multiQueryData: { control: 'object' },
    partsOfUrl: { control: 'object' },
    theme: { options: ['dark', 'light'], control: { type: 'radio' } },
  },

  // Map flat args -> component's { data } prop
  render: args => (
    <>
      <SmartProvider
        theme={args.theme}
        multiQueryValue={{
          isLoading: args.isLoading,
          isError: args.isError,
          errors: args.errors,
          data: args.multiQueryData,
        }}
        partsOfUrl={args.partsOfUrl}
      >
        <div style={{ padding: 16 }}>
          <SecretBase64Plain
            data={{
              id: args.id,
              type: args.type,
              value: args.value,
              reqIndex: args.reqIndex,
              jsonPathToSecrets: args.jsonPathToSecrets,
              multiline: args.multiline,
              multilineRows: args.multilineRows,
              textStyle: args.textStyle,
              emptyText: args.emptyText,
              containerStyle: args.containerStyle,
              inputContainerStyle: args.inputContainerStyle,
              flexProps: args.flexProps,
              niceLooking: args.niceLooking,
              notificationWidth: args.notificationWidth,
              notificationText: args.notificationText,
            }}
          />
        </div>
      </SmartProvider>

      <Editor
        defaultLanguage="yaml"
        width="100%"
        height={150}
        value={yaml.stringify({
          type: 'SecretBase64Plain',
          data: {
            id: args.id,
            type: args.type,
            value: args.value,
            reqIndex: args.reqIndex,
            jsonPathToSecrets: args.jsonPathToSecrets,
            multiline: args.multiline,
            multilineRows: args.multilineRows,
            textStyle: args.textStyle,
            emptyText: args.emptyText,
            containerStyle: args.containerStyle,
            inputContainerStyle: args.inputContainerStyle,
            flexProps: args.flexProps,
            niceLooking: args.niceLooking,
            notificationWidth: args.notificationWidth,
            notificationText: args.notificationText,
          },
        })}
        theme={'vs-dark'}
        options={{
          theme: 'vs-dark',
          readOnly: true,
        }}
      />
    </>
  ),

  parameters: {
    controls: { expanded: true },
  },
}
export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-secterbase64',
    type: 'base64',
    value: "{reqsJsonPath[0]['.data.block.base64value']['-']}",

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          block: {
            base64value:
              'TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gSW50ZWdlciBhdCBwb3J0dGl0b3IgbmliaCwgYWMgdWxsYW1jb3JwZXIgbmlzaS4gRG9uZWMgc29sbGljaXR1ZGluIHZpdmVycmEgbWF4aW11cy4gQWVuZWFuIGFsaXF1YW0gYmliZW5kdW0gb3JjaSwgdmVsIGVsZW1lbnR1bSBuaWJoIGJsYW5kaXQgc2VkLiBOdW5jIHBvc3VlcmUgcXVpcyBlc3QgaWQgcHJldGl1bS4gUGVsbGVudGVzcXVlIGV0IG5pc2wgaW4gZXJvcyB1bHRyaWNlcyBwb3J0YSBuZWMgYWMgbmVxdWUuIEluIHZpdGFlIG1hZ25hIHZvbHV0cGF0LCBldWlzbW9kIGVyYXQgaW4sIGJsYW5kaXQgbGVjdHVzLiBQaGFzZWxsdXMgZXQgdmVsaXQgYSB0b3J0b3IgZmluaWJ1cyB0ZW1wb3IuIE51bGxhbSBhbGlxdWFtIGRvbG9yIGEgc2VtIGZhdWNpYnVzLCBpbiB2aXZlcnJhIGlwc3VtIGFjY3Vtc2FuLiBNb3JiaSBpbiBtaSBkaWFtLiBNb3JiaSBwdXJ1cyBmZWxpcywgY29uc2VjdGV0dXIgbmVjIGxhY3VzIGV1LCBlbGVpZmVuZCBwcmV0aXVtIG9yY2kuIFBlbGxlbnRlc3F1ZSBpZCByaXN1cyBpbiBsZW8gbW9sZXN0aWUgZWZmaWNpdHVyLiBOdW5jIHV0IGFsaXF1YW0gbmlzaS4=',
            plainTextValue: 'I am plain text',
          },
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const Wide: Story = {
  args: {
    ...Default.args,
    inputContainerStyle: {
      minWidth: '400px',
    },
  },
}

export const Narrow: Story = {
  args: {
    ...Default.args,
    inputContainerStyle: {
      width: '35px',
    },
  },
}

export const FlexGap: Story = {
  args: {
    ...Default.args,
    flexProps: {
      gap: 50,
    },
  },
}

export const PlainText: Story = {
  args: {
    ...Default.args,
    type: 'plain',
    value: "{reqsJsonPath[0]['.data.block.plainTextValue']['-']}",
  },
}

export const NiceLooking: Story = {
  args: {
    ...Default.args,
    niceLooking: true,
  },
}

export const Multiline: Story = {
  args: {
    ...Default.args,
    multiline: true,
    multilineRows: 6,
    inputContainerStyle: {
      minWidth: '400px',
    },
  },
}

export const MultilineWithMultipleLinesValue: Story = {
  args: {
    ...Default.args,
    type: 'plain',
    value: "{reqsJsonPath[0]['.data.block.plainTextValue']['-']}",
    multiline: true,
    multilineRows: 6,
    inputContainerStyle: {
      minWidth: '400px',
    },
    multiQueryData: {
      req0: {
        data: {
          block: {
            plainTextValue: `
            First line
            Second line
            Third line`,
          },
        },
      },
    },
  },
}

export const CustomNotification: Story = {
  args: {
    ...Default.args,
    notificationText: 'Some custom text',
    notificationWidth: '600px',
  },
}

export const FromSecretsObject: Story = {
  args: {
    ...Default.args,
    type: 'base64',
    value: undefined,
    reqIndex: '0',
    jsonPathToSecrets: '.data.secretData',
    multiQueryData: {
      req0: {
        data: {
          secretData: {
            username: 'YWRtaW4=',
            password: 'cGFzc3dvcmQ=',
            token: 'dG9rZW4tMTIz',
          },
        },
      },
    },
  },
}

export const FromSecretsObjectPlain: Story = {
  args: {
    ...Default.args,
    type: 'plain',
    value: undefined,
    reqIndex: '0',
    jsonPathToSecrets: '.data.secretDataPlain',
    multiQueryData: {
      req0: {
        data: {
          secretDataPlain: {
            username: 'admin',
            password: 'password',
            token: 'token-123',
          },
        },
      },
    },
  },
}

export const FromSecretsObjectMultiline: Story = {
  args: {
    ...Default.args,
    type: 'plain',
    value: undefined,
    multiline: true,
    multilineRows: 5,
    reqIndex: '0',
    jsonPathToSecrets: '.data.secretDataMultiline',
    inputContainerStyle: {
      minWidth: '400px',
    },
    multiQueryData: {
      req0: {
        data: {
          secretDataMultiline: {
            cert: `-----BEGIN CERT-----
line-1
line-2
-----END CERT-----`,
            config: `apiVersion: v1
kind: ConfigMap
metadata:
  name: sample`,
          },
        },
      },
    },
  },
}

export const FromSecretsObjectWithStyledTitle: Story = {
  args: {
    ...FromSecretsObjectPlain.args,
    textStyle: {
      color: '#1677ff',
      fontSize: 14,
      letterSpacing: 0.3,
    },
  },
}

export const FromSecretsObjectEmpty: Story = {
  args: {
    ...Default.args,
    type: 'plain',
    value: undefined,
    emptyText: 'No secret entries found for this object',
    reqIndex: '0',
    jsonPathToSecrets: '.data.secretDataEmpty',
    multiQueryData: {
      req0: {
        data: {
          secretDataEmpty: {},
        },
      },
    },
  },
}

export const FromSecretsObjectEmptyWithStyleNoCustomText: Story = {
  args: {
    ...FromSecretsObjectEmpty.args,
    textStyle: {
      color: '#d46b08',
      fontSize: 13,
      fontWeight: 600,
    },
    emptyText: undefined,
  },
}

export const FromSecretsObjectEmptyWithStyle: Story = {
  args: {
    ...FromSecretsObjectEmpty.args,
    textStyle: {
      color: '#d46b08',
      fontSize: 13,
      fontWeight: 600,
    },
    emptyText: 'No secrets to display (styled empty state)',
  },
}
