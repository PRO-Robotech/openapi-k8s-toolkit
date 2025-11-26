import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    a11y: { disable: false },
    layout: 'padded',
    options: {
      storySort: {
        order: ['Welcome', ['overview']], // ensure it appears first
      },
    },
    docs: {
      autodocs: true,
    },
  },
}

export default preview
