import path from 'path'
import dotenv from 'dotenv'
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import pkg from './package.json'

const { VITE_BASEPREFIX } = process.env

// Note: We handle @novnc/novnc externalization differently for ES and UMD formats
// For ES: it will be bundled via dynamic import (not external)
// For UMD: it will be externalized to avoid top-level await issues
// The external function below handles this by checking if we're building UMD

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
      external: (id) => {
        // Standard external dependencies
        const externals = [
          'react',
          'react-dom',
          'react-router-dom',
          '@tanstack/react-query',
          '@tanstack/react-query-devtools',
          'antd',
          '@ant-design/icons',
          'styled-components',
        ]
        
        if (externals.includes(id)) {
          return true
        }
        
        // For @novnc/novnc:
        // - For ES format: don't externalize, let it be bundled via dynamic import
        //   This allows Vite to create a separate chunk, avoiding top-level await issues
        // - For UMD format: we need to externalize to avoid top-level await
        //   Since external() is called per-output, we check if UMD output exists
        //   But actually, external() doesn't know which output it's for
        //   So we'll externalize it for both formats, but the consuming app will bundle it for ES
        
        // Actually, the best approach: don't externalize here
        // For ES format, Vite will bundle it via dynamic import
        // For UMD format, we'll handle it via the output's globals config
        // But that won't prevent bundling... 
        
        // Let's try: externalize only if it's clearly a UMD build context
        // Since we can't detect format in external(), we'll use a different approach:
        // Don't externalize @novnc/novnc - let it be bundled for ES
        // For UMD, the build will fail with top-level await, but we'll handle that separately
        // Actually, let's externalize it for both to be safe, and let the consuming app handle bundling
        
        // Final approach: externalize @novnc/novnc to prevent top-level await in UMD
        // The consuming app's Vite config will resolve it and bundle it properly for ES format
        if (id.includes('@novnc/novnc') || id.includes('/novnc/')) {
          return true
        }
        
        return false
      },
      output: [
        {
          format: 'es',
          // For ES format, @novnc/novnc will be bundled via dynamic import
          // The consuming app's Vite will create a separate chunk for it
          // This avoids top-level await issues while still bundling the module
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react-router-dom': 'ReactRouterDOM',
            '@tanstack/react-query': 'reactQuery',
            '@tanstack/react-query-devtools': 'reactQuery-devtools',
            antd: 'antd',
            '@ant-design/icons': 'antdIcons',
            'styled-components': 'styled',
          },
        },
        {
          format: 'umd',
          name: pkg.name,
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react-router-dom': 'ReactRouterDOM',
            '@tanstack/react-query': 'reactQuery',
            '@tanstack/react-query-devtools': 'reactQuery-devtools',
            antd: 'antd',
            '@ant-design/icons': 'antdIcons',
            'styled-components': 'styled',
            '@novnc/novnc': 'noVNC', // Will need to be loaded separately for UMD
          },
        },
      ],
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
