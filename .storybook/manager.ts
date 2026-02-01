// .storybook/manager.ts
import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming' // or import { themes } if you just want light/dark presets
import './preview.css'

const customTheme = create({
  base: 'dark', // or 'light'

  // your branding
  brandTitle: 'OpenAPI K8s Toolkit',
  // brandUrl: 'https://example.com',
  // brandImage: '/my-logo.svg', // put this in your public/ or static folder
  brandTarget: '_self',
})

addons.setConfig({
  theme: customTheme,
})
