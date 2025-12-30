import path from 'path'
import dotenv from 'dotenv'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import pkg from './package.json'

const { VITE_BASEPREFIX } = process.env

export default defineConfig({
  root: './',
  base: VITE_BASEPREFIX || '/toolkit',
  build: {
    target: 'esnext',
    lib: {
      entry: './src/index.ts',
      name: pkg.name,
      fileName: format => `openapi-k8s-toolkit.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@tanstack/react-query-devtools',
        'antd',
        '@ant-design/icons',
        'styled-components',
        'novnc-next',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          '@tanstack/react-query': 'reactQuery',
          '@tanstack/react-query-devtools': 'reactQuery-devtools',
          antd: 'antd',
          '@ant-design/icons': 'antdIcons',
          'styled-components': 'styled',
          'novnc-next': 'NoVNC',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  publicDir: 'public',
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process'],
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      api: path.resolve(__dirname, './src/api'),
      components: path.resolve(__dirname, './src/components'),
      constants: path.resolve(__dirname, './src/constants'),
      localTypes: path.resolve(__dirname, './src/localTypes'),
      mocks: path.resolve(__dirname, './src/mocks'),
      pages: path.resolve(__dirname, './src/pages'),
      store: path.resolve(__dirname, './src/store'),
      templates: path.resolve(__dirname, './src/templates'),
      utils: path.resolve(__dirname, './src/utils'),
      hooks: path.resolve(__dirname, './src/hooks'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
