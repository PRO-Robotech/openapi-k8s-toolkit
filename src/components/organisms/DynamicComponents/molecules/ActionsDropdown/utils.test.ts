/* eslint-disable max-lines-per-function */
import { TActionUnion, TActionsPermissions, TEditActionProps } from '../../types/ActionsDropdown'
import { buildEditUrl, getMenuItems, getRequiredPermissions, getVisibleActions } from './utils'

const toVisibleEntries = (actions: TActionUnion[]) =>
  actions.map((action, index) => ({ action, actionKey: `${action.type}-${index}` }))

describe('buildEditUrl', () => {
  const fullPath = '/openapi-ui/cluster1/builtin-table/pods'

  it('builds URL for builtin resource (no apiGroup)', () => {
    const props: TEditActionProps = {
      text: 'Edit',
      cluster: 'my-cluster',
      namespace: 'default',
      apiVersion: 'v1',
      plural: 'pods',
      name: 'my-pod',
      baseprefix: '/openapi-ui',
    }

    const result = buildEditUrl(props, fullPath)

    expect(result).toBe(
      '/openapi-ui/my-cluster/default/forms/builtin/v1/pods/my-pod?backlink=%2Fopenapi-ui%2Fcluster1%2Fbuiltin-table%2Fpods',
    )
  })

  it('builds URL for custom resource (with apiGroup)', () => {
    const props: TEditActionProps = {
      text: 'Edit',
      cluster: 'my-cluster',
      namespace: 'default',
      apiGroup: 'apps',
      apiVersion: 'v1',
      plural: 'deployments',
      name: 'my-deployment',
      baseprefix: '/openapi-ui',
    }

    const result = buildEditUrl(props, fullPath)

    expect(result).toBe(
      '/openapi-ui/my-cluster/default/forms/apis/apps/v1/deployments/my-deployment?backlink=%2Fopenapi-ui%2Fcluster1%2Fbuiltin-table%2Fpods',
    )
  })

  it('builds URL for cluster-scoped resource (no namespace)', () => {
    const props: TEditActionProps = {
      text: 'Edit',
      cluster: 'my-cluster',
      apiVersion: 'v1',
      plural: 'nodes',
      name: 'my-node',
      baseprefix: '/openapi-ui',
    }

    const result = buildEditUrl(props, fullPath)

    expect(result).toBe(
      '/openapi-ui/my-cluster/forms/builtin/v1/nodes/my-node?backlink=%2Fopenapi-ui%2Fcluster1%2Fbuiltin-table%2Fpods',
    )
  })

  it('handles empty baseprefix', () => {
    const props: TEditActionProps = {
      text: 'Edit',
      cluster: 'my-cluster',
      namespace: 'default',
      apiVersion: 'v1',
      plural: 'pods',
      name: 'my-pod',
    }

    const result = buildEditUrl(props, fullPath)

    expect(result).toBe(
      '/my-cluster/default/forms/builtin/v1/pods/my-pod?backlink=%2Fopenapi-ui%2Fcluster1%2Fbuiltin-table%2Fpods',
    )
  })

  it('strips leading slash from baseprefix', () => {
    const props: TEditActionProps = {
      text: 'Edit',
      cluster: 'my-cluster',
      apiVersion: 'v1',
      plural: 'nodes',
      name: 'my-node',
      baseprefix: '/openapi-ui',
    }

    const result = buildEditUrl(props, fullPath)

    // Should not have double slash
    expect(result.startsWith('/openapi-ui/')).toBe(true)
    expect(result.includes('//openapi-ui')).toBe(false)
  })

  it('includes syntheticProject in URL when provided', () => {
    const props: TEditActionProps = {
      text: 'Edit',
      cluster: 'my-cluster',
      namespace: 'default',
      syntheticProject: 'my-project',
      apiVersion: 'v1',
      plural: 'pods',
      name: 'my-pod',
      baseprefix: '/openapi-ui',
    }

    const result = buildEditUrl(props, fullPath)

    expect(result).toContain('/my-project/')
  })

  it('encodes special characters in fullPath for backlink', () => {
    const specialPath = '/openapi-ui/cluster1/table?filter=name=test&sort=asc'
    const props: TEditActionProps = {
      text: 'Edit',
      cluster: 'my-cluster',
      apiVersion: 'v1',
      plural: 'nodes',
      name: 'my-node',
    }

    const result = buildEditUrl(props, specialPath)

    // Should contain URL-encoded backlink
    expect(result).toContain('backlink=')
    expect(result).toContain('%26') // encoded &
    expect(result).toContain('%3D') // encoded =
  })
})

describe('getMenuItems', () => {
  const mockOnActionClick = jest.fn()

  beforeEach(() => {
    mockOnActionClick.mockClear()
  })

  const createEditAction = (overrides = {}): TActionUnion => ({
    type: 'edit',
    props: {
      text: 'Edit',
      icon: 'EditOutlined',
      cluster: 'cluster',
      apiVersion: 'v1',
      plural: 'pods',
      name: 'pod-1',
      ...overrides,
    },
  })

  const createDeleteAction = (overrides = {}): TActionUnion => ({
    type: 'delete',
    props: {
      text: 'Delete',
      icon: 'DeleteOutlined',
      endpoint: '/api/delete',
      name: 'pod-1',
      ...overrides,
    },
  })

  const allAllowedPermissions: TActionsPermissions = {
    'edit-0': true,
    'delete-1': true,
  }

  it('creates menu items from actions array', () => {
    const actions: TActionUnion[] = [createEditAction(), createDeleteAction()]

    const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, allAllowedPermissions)

    expect(items).toHaveLength(2)
    expect(items[0].key).toBe('edit-0')
    expect(items[0].label).toBe('Edit')
    expect(items[1].key).toBe('delete-1')
    expect(items[1].label).toBe('Delete')
  })

  it('calls onActionClick when item is clicked', () => {
    const editAction = createEditAction()
    const items = getMenuItems(toVisibleEntries([editAction]), mockOnActionClick, { 'edit-0': true })

    items[0].onClick()

    expect(mockOnActionClick).toHaveBeenCalledTimes(1)
    expect(mockOnActionClick).toHaveBeenCalledWith(editAction)
  })

  it('respects disabled prop on individual actions', () => {
    const actions: TActionUnion[] = [createEditAction({ disabled: true }), createDeleteAction({ disabled: false })]

    const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, { 'edit-0': true, 'delete-1': true })

    expect(items[0].disabled).toBe(true)
    expect(items[1].disabled).toBe(false)
  })

  it('respects danger prop on actions', () => {
    const actions: TActionUnion[] = [createEditAction({ danger: false }), createDeleteAction({ danger: true })]

    const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, { 'edit-0': true, 'delete-1': true })

    expect(items[0].danger).toBe(false)
    expect(items[1].danger).toBe(true)
  })
})

describe('getMenuItems - per-action permissions', () => {
  const mockOnActionClick = jest.fn()

  beforeEach(() => {
    mockOnActionClick.mockClear()
  })

  const createEditAction = (overrides = {}): TActionUnion => ({
    type: 'edit',
    props: {
      text: 'Edit',
      cluster: 'my-cluster',
      namespace: 'default',
      apiVersion: 'v1',
      plural: 'pods',
      name: 'my-pod',
      ...overrides,
    },
  })

  const createDeleteAction = (overrides = {}): TActionUnion => ({
    type: 'delete',
    props: {
      text: 'Delete',
      endpoint: '/api/delete',
      name: 'pod-1',
      ...overrides,
    },
  })

  const createEditLabelsAction = (overrides = {}): TActionUnion => ({
    type: 'editLabels',
    props: {
      text: 'Edit Labels',
      reqIndex: '0',
      jsonPathToLabels: '.metadata.labels',
      endpoint: '/api/labels',
      pathToValue: '/metadata/labels',
      modalTitle: 'Edit Labels',
      ...overrides,
    },
  })

  describe('permission-based disabling', () => {
    it('disables edit action when permission is false', () => {
      const actions: TActionUnion[] = [createEditAction()]
      const permissions: TActionsPermissions = { 'edit-0': false }

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('enables edit action when permission is true', () => {
      const actions: TActionUnion[] = [createEditAction()]
      const permissions: TActionsPermissions = { 'edit-0': true }

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(false)
    })

    it('disables delete action when permission is false', () => {
      const actions: TActionUnion[] = [createDeleteAction()]
      const permissions: TActionsPermissions = { 'delete-0': false }

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('enables delete action when permission is true', () => {
      const actions: TActionUnion[] = [createDeleteAction()]
      const permissions: TActionsPermissions = { 'delete-0': true }

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(false)
    })

    it('disables editLabels action when permission is false', () => {
      const actions: TActionUnion[] = [createEditLabelsAction()]
      const permissions: TActionsPermissions = { 'editLabels-0': false }

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('enables editLabels action when permission is true', () => {
      const actions: TActionUnion[] = [createEditLabelsAction()]
      const permissions: TActionsPermissions = { 'editLabels-0': true }

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(false)
    })

    it('disables actions when permissions object is empty', () => {
      const actions: TActionUnion[] = [createEditAction(), createDeleteAction(), createEditLabelsAction()]

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, {})

      expect(items[0].disabled).toBe(true)
      expect(items[1].disabled).toBe(true)
      expect(items[2].disabled).toBe(true)
    })

    it('combines action disabled prop with permission-based disabling', () => {
      const actions: TActionUnion[] = [
        createEditAction({ disabled: true }), // disabled by prop
        createDeleteAction({ disabled: false }), // will be disabled by permission
      ]
      const permissions: TActionsPermissions = { 'edit-0': true, 'delete-1': false }

      const items = getMenuItems(toVisibleEntries(actions), mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true) // disabled by prop
      expect(items[1].disabled).toBe(true) // disabled by permission
    })
  })
})

describe('getRequiredPermissions', () => {
  const createEditAction = (): TActionUnion => ({
    type: 'edit',
    props: {
      text: 'Edit',
      cluster: 'cluster',
      apiVersion: 'v1',
      plural: 'pods',
      name: 'pod-1',
    },
  })

  const createDeleteAction = (): TActionUnion => ({
    type: 'delete',
    props: {
      text: 'Delete',
      endpoint: '/api/delete',
      name: 'pod-1',
    },
  })

  const createEditLabelsAction = (): TActionUnion => ({
    type: 'editLabels',
    props: {
      text: 'Edit Labels',
      reqIndex: '0',
      jsonPathToLabels: '.metadata.labels',
      endpoint: '/api/labels',
      pathToValue: '/metadata/labels',
      modalTitle: 'Edit Labels',
    },
  })

  it('returns required permissions in action order', () => {
    const actions: TActionUnion[] = [createEditAction(), createEditLabelsAction(), createDeleteAction()]

    const required = getRequiredPermissions(actions)

    expect(required).toEqual([{ verb: 'update' }, { verb: 'patch' }, { verb: 'delete' }])
  })

  it('returns patch verb for editAnnotations', () => {
    const action: TActionUnion = {
      type: 'editAnnotations',
      props: {
        text: 'Edit Annotations',
        reqIndex: '0',
        jsonPathToObj: '.metadata.annotations',
        endpoint: '/api/annotations',
        pathToValue: '/metadata/annotations',
        modalTitle: 'Edit Annotations',
        cols: [12, 12],
      },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'patch' }])
  })

  it('returns patch verb for editTaints', () => {
    const action: TActionUnion = {
      type: 'editTaints',
      props: {
        text: 'Edit Taints',
        reqIndex: '0',
        jsonPathToArray: '.spec.taints',
        endpoint: '/api/taints',
        pathToValue: '/spec/taints',
        modalTitle: 'Edit Taints',
        cols: [6, 6, 6, 6],
      },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'patch' }])
  })

  it('returns create verb with eviction subresource for evict', () => {
    const action: TActionUnion = {
      type: 'evict',
      props: { text: 'Evict', endpoint: '/api/evict', name: 'pod-1' },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'create', subresource: 'eviction' }])
  })

  it('returns get verb with proxy subresource for openKubeletConfig', () => {
    const action: TActionUnion = {
      type: 'openKubeletConfig',
      props: { text: 'Kubelet Config', url: '/api/kubelet' },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'get', subresource: 'proxy' }])
  })

  it('returns update verb with scale subresource for scale', () => {
    const action: TActionUnion = {
      type: 'scale',
      props: { text: 'Scale', endpoint: '/api/scale', currentReplicas: '3', name: 'deploy-1' },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'update', subresource: 'scale' }])
  })

  it('returns create verb for triggerRun', () => {
    const action: TActionUnion = {
      type: 'triggerRun',
      props: { text: 'Trigger', createEndpoint: '/api/jobs', cronJobName: 'cron-1', jobTemplate: '{}' },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'create' }])
  })

  it('returns delete verb for deleteChildren', () => {
    const action: TActionUnion = {
      type: 'deleteChildren',
      props: { text: 'Delete Children', children: '[]', childResourceName: 'Jobs' },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'delete' }])
  })

  it('returns create verb for rerunLast', () => {
    const action: TActionUnion = {
      type: 'rerunLast',
      props: { text: 'Rerun', createEndpoint: '/api/jobs', sourceJobSpec: '{}', sourceJobName: 'job-1' },
    }

    expect(getRequiredPermissions([action])).toEqual([{ verb: 'create' }])
  })

  it('returns empty array for empty actions', () => {
    expect(getRequiredPermissions([])).toEqual([])
  })
})

describe('getVisibleActions', () => {
  const baseCtx = {
    replaceValues: {},
    multiQueryData: {
      req0: {
        spec: {
          unschedulable: false,
        },
      },
    } as Record<string, unknown>,
  }

  const cordonAction: TActionUnion = {
    type: 'cordon',
    props: {
      text: 'Cordon',
      endpoint: '/api/cordon',
      pathToValue: '/spec/unschedulable',
      value: true,
      visibleWhen: {
        value: "{reqsJsonPath[0]['.spec.unschedulable']['-']}",
        criteria: 'notEquals',
        valueToCompare: 'true',
      },
    },
  }

  const uncordonAction: TActionUnion = {
    type: 'uncordon',
    props: {
      text: 'Uncordon',
      endpoint: '/api/uncordon',
      pathToValue: '/spec/unschedulable',
      value: false,
      visibleWhen: {
        value: "{reqsJsonPath[0]['.spec.unschedulable']['-']}",
        criteria: 'equals',
        valueToCompare: 'true',
      },
    },
  }

  it('shows cordon and hides uncordon when unschedulable is false', () => {
    const visibleActions = getVisibleActions([cordonAction, uncordonAction], baseCtx)

    expect(visibleActions).toEqual([{ action: cordonAction, actionKey: 'cordon-0' }])
  })

  it('shows uncordon and hides cordon when unschedulable is true', () => {
    const ctx = {
      ...baseCtx,
      multiQueryData: {
        req0: {
          spec: {
            unschedulable: true,
          },
        },
      } as Record<string, unknown>,
    }
    const visibleActions = getVisibleActions([cordonAction, uncordonAction], ctx)

    expect(visibleActions).toEqual([{ action: uncordonAction, actionKey: 'uncordon-1' }])
  })

  it('supports exists criteria', () => {
    const actionWithExists: TActionUnion = {
      type: 'openKubeletConfig',
      props: {
        text: 'Open',
        url: '/api/kubelet',
        visibleWhen: {
          value: "{reqsJsonPath[0]['.spec.unschedulable']['-']}",
          criteria: 'exists',
        },
      },
    }

    expect(getVisibleActions([actionWithExists], baseCtx)).toEqual([
      { action: actionWithExists, actionKey: 'openKubeletConfig-0' },
    ])
  })

  it('supports notExists criteria', () => {
    const actionWithNotExists: TActionUnion = {
      type: 'openKubeletConfig',
      props: {
        text: 'Open',
        url: '/api/kubelet',
        visibleWhen: {
          value: "{reqsJsonPath[0]['.metadata.missing']['-']}",
          criteria: 'notExists',
        },
      },
    }

    expect(getVisibleActions([actionWithNotExists], baseCtx)).toEqual([
      { action: actionWithNotExists, actionKey: 'openKubeletConfig-0' },
    ])
  })

  it('keeps original index in actionKey after filtering', () => {
    const editAction: TActionUnion = {
      type: 'edit',
      props: {
        text: 'Edit',
        cluster: 'cluster',
        apiVersion: 'v1',
        plural: 'pods',
        name: 'pod-1',
      },
    }
    const hiddenSuspendAction: TActionUnion = {
      type: 'suspend',
      props: {
        text: 'Suspend',
        endpoint: '/api/suspend',
        pathToValue: '/spec/paused',
        value: true,
        visibleWhen: {
          value: "{reqsJsonPath[0]['.spec.unschedulable']['-']}",
          criteria: 'equals',
          valueToCompare: 'true',
        },
      },
    }
    const visibleResumeAction: TActionUnion = {
      type: 'resume',
      props: {
        text: 'Resume',
        endpoint: '/api/resume',
        pathToValue: '/spec/paused',
        value: false,
        visibleWhen: {
          value: "{reqsJsonPath[0]['.spec.unschedulable']['-']}",
          criteria: 'notEquals',
          valueToCompare: 'true',
        },
      },
    }

    const visibleActions = getVisibleActions([editAction, hiddenSuspendAction, visibleResumeAction], baseCtx)

    expect(visibleActions).toEqual([
      { action: editAction, actionKey: 'edit-0' },
      { action: visibleResumeAction, actionKey: 'resume-2' },
    ])
  })
})
