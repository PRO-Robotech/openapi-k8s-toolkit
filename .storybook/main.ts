import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'
import dotenv from 'dotenv'
import path from 'path'

const { parsed: options } = dotenv.config({ path: './.env.options' })

const config: StorybookConfig = {
  stories: ['./docs/**/*.tsx', '../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx|js|jsx)'],
  // addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      // 👇 key bit for GitHub Pages
      base: './',

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),

          // 👇 Add our Storybook-only mocks for the hooks
          '../../../DynamicRendererWithProviders/providers/multiQueryProvider': path.resolve(
            __dirname,
            './mocks/multiQueryProvider.tsx',
          ),
          '../../../DynamicRendererWithProviders/providers/partsOfUrlContext': path.resolve(
            __dirname,
            './mocks/partsOfUrlContext.tsx',
          ),
          '../../../DynamicRendererWithProviders/providers/hybridDataProvider': path.resolve(
            __dirname,
            './mocks/hybridDataProvider.tsx',
          ),
          '../../../DynamicRendererWithProviders/providers/themeContext': path.resolve(
            __dirname,
            './mocks/themeContext.tsx',
          ),
        },
      },
      server: {
        proxy: {
          '^/api/clusters/.*/k8s/': {
            // '/api': {
            target: `${options?.KUBE_API_URL}/api/clusters`,
            changeOrigin: true,
            secure: false,
            ws: true,
            rewrite: path => path.replace(/^\/api\/clusters\//, '/'),
            // bypass: function (req, res, proxyOptions) {
            //   const url = req.url || ''
            //   if (/^\/api\/clusters\/[^/]+\/k8s\//.test(url)) {
            //     req.url = url.replace(/^\/api\/clusters\//, '/')
            //     proxyOptions.target = `${options?.KUBE_API_URL}/api/clusters`
            //   } else if (/^\/api\/clusters\/[^/]+\/openapi-bff/.test(url)) {
            //     console.log(req.url)
            //     proxyOptions.target = options?.BFF_URL
            //   }

            //   return null // continue proxy
            // },
            // configure: (proxy, _options) => {
            //   proxy.on('error', (err, _req, _res) => {
            //     console.log('proxy error', err)
            //   })
            //   proxy.on('proxyReq', (proxyReq, req, _res) => {
            //     console.log(
            //       'Sending Request:',
            //       req.method,
            //       req.url,
            //       ' => TO THE TARGET =>  ',
            //       proxyReq.method,
            //       proxyReq.protocol,
            //       proxyReq.host,
            //       proxyReq.path,
            //       JSON.stringify(proxyReq.getHeaders()),
            //     )
            //   })
            //   proxy.on('proxyRes', (proxyRes, req, _res) => {
            //     console.log(
            //       'Received Response from the Target:',
            //       proxyRes.statusCode,
            //       req.url,
            //       JSON.stringify(proxyRes.headers),
            //     )
            //   })
            // },
          },
          '/clusterlist': {
            target: `${options?.KUBE_API_URL}/clusterlist`,
            changeOrigin: true,
            secure: false,
            rewrite: path => path.replace(/^\/clusterlist/, ''),
          },
          '^/api/clusters/.*/openapi-bff': {
            target: options?.BFF_URL,
            changeOrigin: true,
            secure: false,
            // rewrite: path => path.replace(/^\/bff/, ''),
            // configure: (proxy, _options) => {
            //   proxy.on('error', (err, _req, _res) => {
            //     console.log('proxy error', err)
            //   })
            //   proxy.on('proxyReq', (proxyReq, req, _res) => {
            //     console.log(
            //       'Sending Request:',
            //       req.method,
            //       req.url,
            //       ' => TO THE TARGET =>  ',
            //       proxyReq.method,
            //       proxyReq.protocol,
            //       proxyReq.host,
            //       proxyReq.path,
            //       JSON.stringify(proxyReq.getHeaders()),
            //     )
            //   })
            //   proxy.on('proxyRes', (proxyRes, req, _res) => {
            //     console.log(
            //       'Received Response from the Target:',
            //       proxyRes.statusCode,
            //       req.url,
            //       JSON.stringify(proxyRes.headers),
            //     )
            //   })
            // },
          },
          '^/api/clusters/.*/openapi-bff-ws': {
            target: options?.BFF_URL,
            changeOrigin: true,
            secure: false,
            ws: true,
          },
        },
      },
    })
  },
}

export default config
