import { TActionUnion, TActionsPermissions, TEditActionProps } from '../../types/ActionsDropdown'
import { buildEditUrl, getMenuItems } from './utils'

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

  const createEditLabelsAction = (overrides = {}): TActionUnion => ({
    type: 'editLabels',
    props: {
      text: 'Edit Labels',
      icon: 'TagsOutlined',
      reqIndex: '0',
      jsonPathToLabels: '.metadata.labels',
      endpoint: '/api/labels',
      pathToValue: '/metadata/labels',
      modalTitle: 'Edit Labels',
      ...overrides,
    },
  })

  it('creates menu items from actions array', () => {
    const actions: TActionUnion[] = [createEditAction(), createDeleteAction()]

    const items = getMenuItems(actions, mockOnActionClick)

    expect(items).toHaveLength(2)
    expect(items[0].key).toBe('edit-0')
    expect(items[0].label).toBe('Edit')
    expect(items[1].key).toBe('delete-1')
    expect(items[1].label).toBe('Delete')
  })

  it('calls onActionClick when item is clicked', () => {
    const editAction = createEditAction()
    const items = getMenuItems([editAction], mockOnActionClick)

    items[0].onClick()

    expect(mockOnActionClick).toHaveBeenCalledTimes(1)
    expect(mockOnActionClick).toHaveBeenCalledWith(editAction)
  })

  it('respects disabled prop on individual actions', () => {
    const actions: TActionUnion[] = [createEditAction({ disabled: true }), createDeleteAction({ disabled: false })]

    const items = getMenuItems(actions, mockOnActionClick)

    expect(items[0].disabled).toBe(true)
    expect(items[1].disabled).toBe(false)
  })

  it('respects danger prop on actions', () => {
    const actions: TActionUnion[] = [createEditAction({ danger: false }), createDeleteAction({ danger: true })]

    const items = getMenuItems(actions, mockOnActionClick)

    expect(items[0].danger).toBe(false)
    expect(items[1].danger).toBe(true)
  })

  describe('permission-based disabling', () => {
    it('disables edit action when canUpdate is false', () => {
      const actions: TActionUnion[] = [createEditAction()]
      const permissions: TActionsPermissions = { canUpdate: false }

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('enables edit action when canUpdate is true', () => {
      const actions: TActionUnion[] = [createEditAction()]
      const permissions: TActionsPermissions = { canUpdate: true }

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(false)
    })

    it('disables delete action when canDelete is false', () => {
      const actions: TActionUnion[] = [createDeleteAction()]
      const permissions: TActionsPermissions = { canDelete: false }

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('enables delete action when canDelete is true', () => {
      const actions: TActionUnion[] = [createDeleteAction()]
      const permissions: TActionsPermissions = { canDelete: true }

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(false)
    })

    it('disables editLabels action when canPatch is false', () => {
      const actions: TActionUnion[] = [createEditLabelsAction()]
      const permissions: TActionsPermissions = { canPatch: false }

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('enables editLabels action when canPatch is true', () => {
      const actions: TActionUnion[] = [createEditLabelsAction()]
      const permissions: TActionsPermissions = { canPatch: true }

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(false)
    })

    it('disables editAnnotations action when canPatch is false', () => {
      const action: TActionUnion = {
        type: 'editAnnotations',
        props: {
          text: 'Edit Annotations',
          icon: 'FileTextOutlined',
          reqIndex: '0',
          jsonPathToObj: '.metadata.annotations',
          endpoint: '/api/annotations',
          pathToValue: '/metadata/annotations',
          modalTitle: 'Edit Annotations',
        },
      }
      const permissions: TActionsPermissions = { canPatch: false }

      const items = getMenuItems([action], mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('disables editTaints action when canPatch is false', () => {
      const action: TActionUnion = {
        type: 'editTaints',
        props: {
          text: 'Edit Taints',
          reqIndex: '0',
          jsonPathToArray: '.spec.taints',
          endpoint: '/api/taints',
          pathToValue: '/spec/taints',
          modalTitle: 'Edit Taints',
        },
      }
      const permissions: TActionsPermissions = { canPatch: false }

      const items = getMenuItems([action], mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('disables editTolerations action when canPatch is false', () => {
      const action: TActionUnion = {
        type: 'editTolerations',
        props: {
          text: 'Edit Tolerations',
          reqIndex: '0',
          jsonPathToArray: '.spec.tolerations',
          endpoint: '/api/tolerations',
          pathToValue: '/spec/tolerations',
          modalTitle: 'Edit Tolerations',
        },
      }
      const permissions: TActionsPermissions = { canPatch: false }

      const items = getMenuItems([action], mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true)
    })

    it('does not disable actions when permissions object is undefined', () => {
      const actions: TActionUnion[] = [createEditAction(), createDeleteAction(), createEditLabelsAction()]

      const items = getMenuItems(actions, mockOnActionClick, undefined)

      expect(items[0].disabled).toBeFalsy()
      expect(items[1].disabled).toBeFalsy()
      expect(items[2].disabled).toBeFalsy()
    })

    it('does not disable actions when specific permission is undefined', () => {
      const actions: TActionUnion[] = [createEditAction(), createDeleteAction(), createEditLabelsAction()]
      const permissions: TActionsPermissions = {} // all undefined

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      // undefined !== false, so should not be disabled
      expect(items[0].disabled).toBeFalsy()
      expect(items[1].disabled).toBeFalsy()
      expect(items[2].disabled).toBeFalsy()
    })

    it('combines action disabled prop with permission-based disabling', () => {
      const actions: TActionUnion[] = [
        createEditAction({ disabled: true }), // disabled by prop
        createDeleteAction({ disabled: false }), // will be disabled by permission
      ]
      const permissions: TActionsPermissions = { canUpdate: true, canDelete: false }

      const items = getMenuItems(actions, mockOnActionClick, permissions)

      expect(items[0].disabled).toBe(true) // disabled by prop
      expect(items[1].disabled).toBe(true) // disabled by permission
    })
  })
})
