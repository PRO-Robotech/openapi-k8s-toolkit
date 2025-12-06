import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { ContentCard } from './ContentCard'
import { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['ContentCard']

type TArgs = TInner & {
  children?: React.ReactNode
  showYaml?: boolean
}

const meta: Meta<TArgs> = {
  title: 'Factory/ContentCard',
  component: ContentCard as any,
  argTypes: {
    id: {
      control: 'text',
      description: 'data.id',
    },
    flexGrow: {
      control: 'number',
      description: 'data.flexGrow (flex-grow of the card container)',
    },
    displayFlex: {
      control: 'boolean',
      description: 'data.displayFlex (switch between block / flex layout)',
    },
    flexFlow: {
      control: 'text',
      description: 'data.flexFlow (flex-flow when displayFlex=true, e.g. "column nowrap")',
    },
    maxHeight: {
      control: 'number',
      description: 'data.maxHeight (max height in px, default 100%)',
    },
    children: {
      control: 'text',
      description: 'Content rendered inside the ContentCard slot',
    },
    showYaml: {
      control: 'boolean',
      description: 'Toggle YAML preview of factory config',
    },
  },

  render: args => {
    const { showYaml, children, ...data } = args

    return (
      <>
        <div style={{ padding: 16, maxWidth: 800 }}>
          <ContentCard data={data}>{children ?? 'Content inside ContentCard'}</ContentCard>
        </div>

        {showYaml && (
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={220}
            value={yaml.stringify({
              type: 'ContentCard',
              data,
            })}
            theme="vs-dark"
            options={{
              readOnly: true,
            }}
          />
        )}
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
    id: 'example-content-card',
    flexGrow: 1,
    displayFlex: false,
    flexFlow: 'row nowrap',
    maxHeight: 300,
    children: 'This is a basic ContentCard with some example text.',
    showYaml: true,
  },
}

export const FlexColumn: Story = {
  args: {
    ...Default.args,
    id: 'content-card-flex-column',
    displayFlex: true,
    flexFlow: 'column nowrap',
    children: (
      <div>
        <div>Row 1</div>
        <div>Row 2</div>
        <div>Row 3</div>
      </div>
    ),
  },
}

export const LimitedHeight: Story = {
  args: {
    ...Default.args,
    id: 'content-card-limited-height',
    maxHeight: 160,
    children: (
      <div>
        <p>Card with maxHeight and scrollable content:</p>
        <p>Line 1</p>
        <p>Line 2</p>
        <p>Line 3</p>
        <p>Line 4</p>
        <p>Line 5</p>
      </div>
    ),
  },
}
