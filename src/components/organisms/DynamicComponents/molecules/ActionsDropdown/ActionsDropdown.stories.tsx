import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { ActionsDropdown } from './ActionsDropdown'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['ActionsDropdown']

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
  title: 'Factory/ActionsDropdown',
  component: ActionsDropdown as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    buttonText: {
      control: 'text',
      description: 'data.buttonText (default: "Actions")',
    },
    buttonVariant: {
      control: 'radio',
      options: ['default', 'icon'],
      description: 'data.buttonVariant ("default" = text button, "icon" = three-dots icon)',
    },
    containerStyle: {
      control: 'object',
      description: 'data.containerStyle (CSSProperties for the container)',
    },
    actions: {
      control: 'object',
      description: 'data.actions (array of action objects with type and props)',
    },
    permissions: {
      control: 'object',
      description: 'data.permissions ({ canUpdate, canPatch, canDelete } - manual override, takes priority)',
    },
    // permissionContext is now per-action (on each action.props.permissionContext)

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
    },
    isError: {
      control: 'boolean',
      description: 'useMultiQuery.isError (simulated)',
    },
    errors: {
      control: 'object',
      description: 'useMultiQuery.errors (array of { message })',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into SmartProvider -> useMultiQuery',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      buttonText: args.buttonText,
      buttonVariant: args.buttonVariant,
      containerStyle: args.containerStyle,
      actions: args.actions,
      permissions: args.permissions,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{
            data: args.multiQueryData,
            isLoading: args.isLoading,
            isError: args.isError,
            errors: args.errors,
          }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <ActionsDropdown data={data} />
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={400}
          value={yaml.stringify({
            type: 'ActionsDropdown',
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
    id: 'example-actions-dropdown',
    buttonText: 'Actions',
    buttonVariant: 'default',
    containerStyle: {},
    permissions: { 'edit-0': true, 'editLabels-1': true, 'editAnnotations-2': true, 'delete-3': true },
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit',
          icon: 'EditOutlined',
          cluster: 'default',
          apiVersion: 'v1',
          plural: 'pods',
          name: 'example-pod',
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'editLabels',
        props: {
          text: 'Edit Labels',
          icon: 'TagsOutlined',
          reqIndex: '0',
          jsonPathToLabels: '.metadata.labels',
          endpoint: '/api/mock/labels',
          pathToValue: '/metadata/labels',
          modalTitle: 'Edit Labels',
          editModalWidth: 650,
        },
      },
      {
        type: 'editAnnotations',
        props: {
          text: 'Edit Annotations',
          icon: 'FileTextOutlined',
          reqIndex: '0',
          jsonPathToObj: '.metadata.annotations',
          endpoint: '/api/mock/annotations',
          pathToValue: '/metadata/annotations',
          modalTitle: 'Edit Annotations',
          editModalWidth: 720,
          cols: [12, 12],
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          endpoint: '/api/mock/delete',
          name: 'example-pod',
        },
      },
    ],

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'example-pod',
          labels: {
            app: 'demo',
            tier: 'frontend',
          },
          annotations: {
            'kubectl.kubernetes.io/last-applied-configuration': '...',
          },
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default', 'ns', 'factory', 'pod-details'],
    theme: 'light',
  },
}

export const IconVariant: Story = {
  args: {
    ...Default.args,
    id: 'example-actions-dropdown-icon',
    buttonText: '',
    buttonVariant: 'icon',
  },
}

export const WithCustomSvgIcon: Story = {
  args: {
    ...Default.args,
    id: 'example-actions-dropdown-custom-icon',
    actions: [
      ...(Default.args?.actions?.slice(0, 3) || []),
      {
        type: 'editTolerations',
        props: {
          text: 'Edit Tolerations',
          iconBase64Encoded:
            'PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE4LjgxNDcgMTguMjE5NUMxOS45ODUyIDE4LjIxOTUgMjAuOTQxNSAxNy4yNDk5IDIwLjk0MTUgMTYuMDYzM0MyMC45NDE1IDE0LjYzMDIgMTguODE0NyAxMi4yOTE4IDE4LjgxNDcgMTIuMjkxOEMxOC44MTQ3IDEyLjI5MTggMTYuNjg3OSAxNC42MzAyIDE2LjY4NzkgMTYuMDYzM0MxNi42ODc5IDE3LjI0OTkgMTcuNjQ0MiAxOC4yMTk1IDE4LjgxNDcgMTguMjE5NVpNOC43MTM4MSAxNy4wMzgzQzguOTAzOTkgMTcuMjI4NSA5LjIxMjAzIDE3LjIyODUgOS4zOTk1MyAxNy4wMzgzTDE2LjI1OTMgMTAuMTgxMUMxNi40NDk1IDkuOTkwOTUgMTYuNDQ5NSA5LjY4MjkyIDE2LjI1OTMgOS40OTU0Mkw5LjQwMjIgMi42MzgyN0M5LjM4NjEzIDIuNjIyMiA5LjM2NzM4IDIuNjA2MTMgOS4zNDg2MyAyLjU5Mjc0TDcuMjUzOTkgMC40OTgwOTRDNy4yMDgzMiAwLjQ1MzAxMiA3LjE0NjczIDAuNDI3NzM0IDcuMDgyNTYgMC40Mjc3MzRDNy4wMTgzOSAwLjQyNzczNCA2Ljk1NjggMC40NTMwMTIgNi45MTExMyAwLjQ5ODA5NEw1LjYyNTQyIDEuNzgzODFDNS41ODAzNCAxLjgyOTQ4IDUuNTU1MDYgMS44OTEwNyA1LjU1NTA2IDEuOTU1MjRDNS41NTUwNiAyLjAxOTQxIDUuNTgwMzQgMi4wODEgNS42MjU0MiAyLjEyNjY3TDcuNDI1NDIgMy45MjY2N0wxLjg1OTM1IDkuNDk1NDJDMS42NjkxNyA5LjY4NTYgMS42NjkxNyA5Ljk5MzYzIDEuODU5MzUgMTAuMTgxMUw4LjcxMzgxIDE3LjAzODNaTTkuMDU5MzUgNS4wMjIyTDEzLjg1MTMgOS44MTQxN0g0LjI3MDA2TDkuMDU5MzUgNS4wMjIyWk0yMi41MDA0IDIwLjE0MDFIMS41MDA0MkMxLjM4MjU2IDIwLjE0MDEgMS4yODYxMyAyMC4yMzY1IDEuMjg2MTMgMjAuMzU0M1YyMi40OTcyQzEuMjg2MTMgMjIuNjE1MSAxLjM4MjU2IDIyLjcxMTUgMS41MDA0MiAyMi43MTE1SDIyLjUwMDRDMjIuNjE4MyAyMi43MTE1IDIyLjcxNDcgMjIuNjE1MSAyMi43MTQ3IDIyLjQ5NzJWMjAuMzU0M0MyMi43MTQ3IDIwLjIzNjUgMjIuNjE4MyAyMC4xNDAxIDIyLjUwMDQgMjAuMTQwMVoiIGZpbGw9e3Rva2VuLmNvbG9yVGV4dH0vPgo8L3N2Zz4K',
          reqIndex: '0',
          jsonPathToArray: '.spec.tolerations',
          endpoint: '/api/mock/tolerations',
          pathToValue: '/spec/tolerations',
          modalTitle: 'Edit Tolerations',
          editModalWidth: 900,
          cols: [6, 6, 6, 6],
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          endpoint: '/api/mock/delete',
          name: 'example-pod',
        },
      },
    ],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'example-pod',
          labels: { app: 'demo' },
          annotations: {},
        },
        spec: {
          tolerations: [{ key: 'node-role.kubernetes.io/control-plane', operator: 'Exists', effect: 'NoSchedule' }],
        },
      },
    },
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    id: 'example-actions-dropdown-loading',
    isLoading: true,
  },
}

export const Error: Story = {
  args: {
    ...Default.args,
    id: 'example-actions-dropdown-error',
    isError: true,
    errors: [{ message: 'Failed to fetch resource data' }],
  },
}

export const TableRowContext: Story = {
  args: {
    id: 'pod-row-actions',
    buttonText: '',
    buttonVariant: 'icon',
    containerStyle: {
      display: 'flex',
      justifyContent: 'center',
    },
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit',
          icon: 'EditOutlined',
          cluster: '{2}',
          namespace: "{reqsJsonPath[0]['.metadata.namespace']['-']}",
          apiVersion: 'v1',
          plural: 'pods',
          name: "{reqsJsonPath[0]['.metadata.name']['-']}",
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'editLabels',
        props: {
          text: 'Edit Labels',
          icon: 'TagsOutlined',
          reqIndex: '0',
          jsonPathToLabels: '.metadata.labels',
          endpoint:
            "/api/clusters/{2}/k8s/api/v1/namespaces/{reqsJsonPath[0]['.metadata.namespace']['-']}/pods/{reqsJsonPath[0]['.metadata.name']['-']}",
          pathToValue: '/metadata/labels',
          modalTitle: 'Edit Pod Labels',
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          endpoint:
            "/api/clusters/{2}/k8s/api/v1/namespaces/{reqsJsonPath[0]['.metadata.namespace']['-']}/pods/{reqsJsonPath[0]['.metadata.name']['-']}",
          name: "{reqsJsonPath[0]['.metadata.name']['-']}",
        },
      },
    ],

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'nginx-deployment-abc123',
          namespace: 'default',
          labels: { app: 'nginx' },
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default', 'builtin-table', 'pods'],
    theme: 'light',
  },
}

/**
 * Demonstrates permission-based action disabling.
 * User has canUpdate but no canPatch or canDelete.
 * Edit action is enabled, but Labels/Annotations/Delete are disabled.
 */
export const WithPermissions: Story = {
  args: {
    id: 'permissions-demo',
    buttonText: 'Actions',
    buttonVariant: 'default',
    containerStyle: {},
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit (requires update)',
          icon: 'EditOutlined',
          cluster: 'default',
          apiVersion: 'v1',
          plural: 'pods',
          name: 'example-pod',
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'editLabels',
        props: {
          text: 'Edit Labels (requires patch)',
          icon: 'TagsOutlined',
          reqIndex: '0',
          jsonPathToLabels: '.metadata.labels',
          endpoint: '/api/mock/labels',
          pathToValue: '/metadata/labels',
          modalTitle: 'Edit Labels',
          editModalWidth: 650,
        },
      },
      {
        type: 'editAnnotations',
        props: {
          text: 'Edit Annotations (requires patch)',
          icon: 'FileTextOutlined',
          reqIndex: '0',
          jsonPathToObj: '.metadata.annotations',
          endpoint: '/api/mock/annotations',
          pathToValue: '/metadata/annotations',
          modalTitle: 'Edit Annotations',
          cols: [12, 12],
          editModalWidth: 720,
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete (requires delete)',
          icon: 'DeleteOutlined',
          endpoint: '/api/mock/delete',
          name: 'example-pod',
        },
      },
    ],
    permissions: {
      'edit-0': true,
      'editLabels-1': false,
      'editAnnotations-2': false,
      'delete-3': false,
    },

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'example-pod',
          namespace: 'default',
          labels: { app: 'demo' },
          annotations: { description: 'test' },
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default'],
    theme: 'light',
  },
}

/**
 * Node detail page — includes editTaints, cordon/uncordon, and openKubeletConfig.
 */
export const NodeActions: Story = {
  args: {
    id: 'node-actions',
    buttonText: 'Actions',
    buttonVariant: 'default',
    containerStyle: {},
    permissions: {
      'edit-0': true,
      'editTaints-1': true,
      'cordon-2': true,
      'uncordon-3': true,
      'openKubeletConfig-4': true,
      'delete-5': true,
    },
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit',
          icon: 'EditOutlined',
          cluster: 'default',
          apiVersion: 'v1',
          plural: 'nodes',
          name: 'worker-node-01',
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'editTaints',
        props: {
          text: 'Edit Taints',
          icon: 'WarningOutlined',
          reqIndex: '0',
          jsonPathToArray: '.spec.taints',
          endpoint: '/api/clusters/default/k8s/api/v1/nodes/worker-node-01',
          pathToValue: '/spec/taints',
          modalTitle: 'Edit Taints',
          editModalWidth: 800,
          notificationSuccessMessage: 'Taints updated',
          notificationSuccessMessageDescription: 'Taints have been updated successfully',
          cols: [6, 6, 6, 6],
        },
      },
      {
        type: 'cordon',
        props: {
          text: 'Cordon',
          icon: 'StopOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/nodes/worker-node-01',
          pathToValue: '/spec/unschedulable',
          value: true,
        },
      },
      {
        type: 'uncordon',
        props: {
          text: 'Uncordon',
          icon: 'CheckCircleOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/nodes/worker-node-01',
          pathToValue: '/spec/unschedulable',
          value: false,
        },
      },
      {
        type: 'openKubeletConfig',
        props: {
          text: 'Kubelet Config',
          icon: 'SettingOutlined',
          url: '/api/clusters/default/k8s/api/v1/nodes/worker-node-01/proxy/configz',
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/nodes/worker-node-01',
          name: 'worker-node-01',
          redirectTo: '/openapi-ui/default/builtin-table/nodes',
        },
      },
    ],

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'worker-node-01',
          labels: { 'kubernetes.io/os': 'linux', 'node-role.kubernetes.io/worker': '' },
        },
        spec: {
          taints: [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }],
          unschedulable: false,
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default', 'builtin-table', 'nodes', 'worker-node-01'],
    theme: 'light',
  },
}

/**
 * Pod detail page — includes evict action.
 */
export const PodActions: Story = {
  args: {
    id: 'pod-actions',
    buttonText: 'Actions',
    buttonVariant: 'default',
    containerStyle: {},
    permissions: { 'edit-0': true, 'evict-1': true, 'delete-2': true },
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit',
          icon: 'EditOutlined',
          cluster: 'default',
          namespace: 'kube-system',
          apiVersion: 'v1',
          plural: 'pods',
          name: 'coredns-abc123',
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'evict',
        props: {
          text: 'Evict',
          icon: 'DisconnectOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/namespaces/kube-system/pods/coredns-abc123/eviction',
          name: 'coredns-abc123',
          namespace: 'kube-system',
          apiVersion: 'policy/v1',
          gracePeriodSeconds: 30,
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/namespaces/kube-system/pods/coredns-abc123',
          name: 'coredns-abc123',
        },
      },
    ],

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'coredns-abc123',
          namespace: 'kube-system',
          labels: { 'k8s-app': 'kube-dns' },
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default', 'kube-system', 'pods', 'coredns-abc123'],
    theme: 'light',
  },
}

/**
 * ConfigMap detail page — includes downloadAsFiles and createFromFiles actions.
 */
export const ConfigMapActions: Story = {
  args: {
    id: 'configmap-actions',
    buttonText: 'Actions',
    buttonVariant: 'default',
    containerStyle: {},
    permissions: {
      'edit-0': true,
      'downloadAsFiles-1': true,
      'createFromFiles-2': true,
      'delete-3': true,
    },
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit',
          icon: 'EditOutlined',
          cluster: 'default',
          namespace: 'default',
          apiVersion: 'v1',
          plural: 'configmaps',
          name: 'app-config',
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'downloadAsFiles',
        props: {
          text: 'Download as files',
          icon: 'DownloadOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/namespaces/default/configmaps/app-config',
          resourceKind: 'ConfigMap',
          name: 'app-config',
        },
      },
      {
        type: 'createFromFiles',
        props: {
          text: 'Create from files',
          icon: 'UploadOutlined',
          createEndpoint: '/api/clusters/default/k8s/api/v1/namespaces/default/configmaps',
          namespace: 'default',
          resourceKind: 'ConfigMap',
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/namespaces/default/configmaps/app-config',
          name: 'app-config',
        },
      },
    ],

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'app-config',
          namespace: 'default',
          labels: { app: 'demo' },
        },
        data: {
          'application.yml': 'server:\n  port: 8080\nspring:\n  profiles:\n    active: production\n',
          'nginx.conf': 'worker_processes auto;\nevents { worker_connections 1024; }\n',
          'envoy.yaml': 'admin:\n  address:\n    socket_address:\n      address: 0.0.0.0\n      port_value: 9901\n',
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default', 'default', 'configmaps', 'app-config'],
    theme: 'light',
  },
}

/**
 * Secret detail page — includes downloadAsFiles and createFromFiles actions.
 * Secret .data values are base64-encoded.
 */
export const SecretActions: Story = {
  args: {
    id: 'secret-actions',
    buttonText: 'Actions',
    buttonVariant: 'default',
    containerStyle: {},
    permissions: {
      'edit-0': true,
      'downloadAsFiles-1': true,
      'createFromFiles-2': true,
      'delete-3': true,
    },
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit',
          icon: 'EditOutlined',
          cluster: 'default',
          namespace: 'default',
          apiVersion: 'v1',
          plural: 'secrets',
          name: 'tls-cert',
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'downloadAsFiles',
        props: {
          text: 'Download as files',
          icon: 'DownloadOutlined',
          endpoint: '/api/clusters/default/k8s/api/v1/namespaces/default/secrets/tls-cert',
          resourceKind: 'Secret',
          name: 'tls-cert',
        },
      },
      {
        type: 'createFromFiles',
        props: {
          text: 'Create from files',
          icon: 'UploadOutlined',
          createEndpoint: '/api/clusters/default/k8s/api/v1/namespaces/default/secrets',
          namespace: 'default',
          resourceKind: 'Secret',
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          danger: true,
          endpoint: '/api/clusters/default/k8s/api/v1/namespaces/default/secrets/tls-cert',
          name: 'tls-cert',
        },
      },
    ],

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'tls-cert',
          namespace: 'default',
          labels: { app: 'ingress' },
        },
        data: {
          'tls.crt': btoa('-----BEGIN CERTIFICATE-----\nMIICpDCCAYwCCQDU+pQ4pBmm...\n-----END CERTIFICATE-----'),
          'tls.key': btoa('-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA2a2rwplBQ...\n-----END RSA PRIVATE KEY-----'),
          'ca.crt': btoa('-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAJC1...\n-----END CERTIFICATE-----'),
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default', 'default', 'secrets', 'tls-cert'],
    theme: 'light',
  },
}

/**
 * Deployment detail page — includes suspend/resume and rolloutRestart.
 */
export const DeploymentActions: Story = {
  args: {
    id: 'deployment-actions',
    buttonText: 'Actions',
    buttonVariant: 'default',
    containerStyle: {},
    permissions: { 'edit-0': true, 'suspend-1': true, 'resume-2': true, 'rolloutRestart-3': true, 'delete-4': true },
    actions: [
      {
        type: 'edit',
        props: {
          text: 'Edit',
          icon: 'EditOutlined',
          cluster: 'default',
          namespace: 'production',
          apiVersion: 'apps/v1',
          plural: 'deployments',
          name: 'nginx-deployment',
          baseprefix: '/openapi-ui',
        },
      },
      {
        type: 'suspend',
        props: {
          text: 'Suspend',
          icon: 'PauseCircleOutlined',
          endpoint: '/api/clusters/default/k8s/apis/apps/v1/namespaces/production/deployments/nginx-deployment',
          pathToValue: '/spec/paused',
          value: true,
        },
      },
      {
        type: 'resume',
        props: {
          text: 'Resume',
          icon: 'PlayCircleOutlined',
          endpoint: '/api/clusters/default/k8s/apis/apps/v1/namespaces/production/deployments/nginx-deployment',
          pathToValue: '/spec/paused',
          value: false,
        },
      },
      {
        type: 'rolloutRestart',
        props: {
          text: 'Rollout Restart',
          icon: 'ReloadOutlined',
          endpoint: '/api/clusters/default/k8s/apis/apps/v1/namespaces/production/deployments/nginx-deployment',
        },
      },
      {
        type: 'delete',
        props: {
          text: 'Delete',
          icon: 'DeleteOutlined',
          endpoint: '/api/clusters/default/k8s/apis/apps/v1/namespaces/production/deployments/nginx-deployment',
          name: 'nginx-deployment',
          redirectTo: '/openapi-ui/default/builtin-table/deployments',
        },
      },
    ],

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'nginx-deployment',
          namespace: 'production',
          labels: { app: 'nginx' },
          annotations: {},
        },
        spec: {
          replicas: 3,
          paused: false,
        },
      },
    },
    partsOfUrl: ['openapi-ui', 'default', 'production', 'deployments', 'nginx-deployment'],
    theme: 'light',
  },
}
