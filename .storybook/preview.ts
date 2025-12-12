import type { Preview } from '@storybook/react'
import { initialize, mswLoader } from 'msw-storybook-addon'

initialize()

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    a11y: { disable: false },
    layout: 'padded',
    options: {
      storySort: {
        order: ['Welcome', ['overview']],
      },
    },
    docs: { autodocs: true },
  },
  loaders: [mswLoader],
}

export default preview
