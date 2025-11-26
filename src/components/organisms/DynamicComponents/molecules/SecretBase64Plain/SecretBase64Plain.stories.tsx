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
    base64Value: { control: 'text', description: 'data.base64Value' },
    plainTextValue: { control: 'text', description: 'data.plainTextValue' },
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
              base64Value: args.base64Value,
              plainTextValue: args.plainTextValue,
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
            base64Value: args.base64Value,
            plainTextValue: args.plainTextValue,
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
    base64Value: "{reqsJsonPath[0]['.data.block.base64value']['-']}",

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
    base64Value: undefined,
    plainTextValue: "{reqsJsonPath[0]['.data.block.plainTextValue']['-']}",
  },
}

export const NiceLooking: Story = {
  args: {
    ...Default.args,
    niceLooking: true,
  },
}

export const CustomNotification: Story = {
  args: {
    ...Default.args,
    notificationText: 'Some custom text',
    notificationWidth: '600px',
  },
}
