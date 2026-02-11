/* eslint-disable no-nested-ternary */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { notification } from 'antd'
import { AxiosError } from 'axios'
import _ from 'lodash'
import { createNewEntry, updateEntry, patchEntryWithMergePatch, patchEntryWithReplaceOp } from 'api/forms'
import { parseAll, parseWithoutPartsOfUrl, parsePartsOfUrl } from '../../utils'
import { buildEditUrl } from '../utils'
import type { TActionUnion, TEvictActionProps } from '../../../types/ActionsDropdown'

type TDeleteModalData = {
  name: string
  endpoint: string
  redirectTo?: string
}

export type TEvictModalData = {
  name: string
  endpoint: string
  namespace?: string
  apiVersion: string
  gracePeriodSeconds?: number
  dryRun?: string[]
}

export type TScaleModalData = {
  endpoint: string
  currentReplicas: number
  name: string
  namespace?: string
  apiVersion: string
}

export type TDeleteChildrenModalData = {
  children: { name: string; endpoint: string }[]
  childResourceName: string
}

export type TRerunModalData = {
  createEndpoint: string
  sourceName: string
  sourceSpec: Record<string, unknown>
}

export type TParseContext = {
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}

export const parseValueIfString = (value: unknown, ctx: TParseContext) => {
  if (typeof value === 'string') {
    return parseAll({ text: value, ...ctx })
  }
  return value
}

/**
 * Resolves a multiQuery template path like "{reqs[0]['spec','jobTemplate']}" to the actual JS object.
 * Falls back to JSON.parse of the string result if direct resolution fails.
 */
const resolveObjectFromTemplate = (template: string, multiQueryData: Record<string, unknown>): unknown => {
  // Try to extract the reqs[N][path...] pattern and resolve directly
  const match = template.match(/^\{reqs\[(\d+)\]\[((?:\s*['"][^'"]+['"]\s*,?)+)\]\}$/)
  if (match) {
    const reqIndex = parseInt(match[1], 10)
    const pathKeys = Array.from(match[2].matchAll(/['"]([^'"]+)['"]/g)).map(m => m[1])
    const reqData = multiQueryData[`req${reqIndex}`]
    if (reqData != null) {
      return _.get(reqData, pathKeys)
    }
  }
  return undefined
}

export const buildEvictModalData = (props: TEvictActionProps, ctx: TParseContext): TEvictModalData => {
  const endpointPrepared = parseAll({ text: props.endpoint, ...ctx })
  const namePrepared = parseAll({ text: props.name, ...ctx })
  const namespacePrepared = props.namespace ? parseAll({ text: props.namespace, ...ctx }) : undefined
  const apiVersionPrepared = props.apiVersion ? parseAll({ text: props.apiVersion, ...ctx }) : 'policy/v1'

  return {
    endpoint: endpointPrepared,
    name: namePrepared,
    namespace: namespacePrepared,
    apiVersion: apiVersionPrepared,
    gracePeriodSeconds: props.gracePeriodSeconds,
    dryRun: props.dryRun,
  }
}

export const buildEvictBody = (data: TEvictModalData) => {
  const deleteOptions: Record<string, unknown> = {}
  if (data.gracePeriodSeconds !== undefined) {
    deleteOptions.gracePeriodSeconds = data.gracePeriodSeconds
  }
  if (data.dryRun && data.dryRun.length > 0) {
    deleteOptions.dryRun = data.dryRun
  }

  return {
    apiVersion: data.apiVersion,
    kind: 'Eviction',
    metadata: {
      name: data.name,
      ...(data.namespace ? { namespace: data.namespace } : {}),
    },
    ...(Object.keys(deleteOptions).length > 0 ? { deleteOptions } : {}),
  }
}

export const buildDeleteChildrenData = (
  action: Extract<TActionUnion, { type: 'deleteChildren' }>,
  ctx: TParseContext,
): TDeleteChildrenModalData => {
  const childResourceNamePrepared = parseAll({ text: action.props.childResourceName, ...ctx })

  // IMPORTANT:
  // `children` is JSON text. We must not run `parseAll` on the whole JSON string,
  // because `prepareTemplate` would treat JSON object braces as placeholders and break JSON.
  const childrenTemplatePrepared = parseWithoutPartsOfUrl({
    text: action.props.children,
    multiQueryData: ctx.multiQueryData,
  })

  let parsedChildren: unknown
  try {
    parsedChildren = JSON.parse(childrenTemplatePrepared)
  } catch {
    throw new Error('Could not parse children data')
  }

  if (!Array.isArray(parsedChildren)) {
    throw new Error('No children found to delete')
  }

  const children = parsedChildren
    .filter(
      (el): el is { name: string; endpoint: string } =>
        typeof el === 'object' &&
        el !== null &&
        typeof (el as { name?: unknown }).name === 'string' &&
        typeof (el as { endpoint?: unknown }).endpoint === 'string',
    )
    .map(el => ({
      name: parsePartsOfUrl({ template: el.name, replaceValues: ctx.replaceValues }),
      endpoint: parsePartsOfUrl({ template: el.endpoint, replaceValues: ctx.replaceValues }),
    }))

  if (children.length === 0) {
    throw new Error('No children found to delete')
  }

  return {
    children,
    childResourceName: childResourceNamePrepared,
  }
}

const handleEditAction = (
  action: Extract<TActionUnion, { type: 'edit' }>,
  ctx: TParseContext,
  fullPath: string,
  navigate: ReturnType<typeof useNavigate>,
) => {
  const clusterPrepared = parseAll({ text: action.props.cluster, ...ctx })
  const namespacePrepared = action.props.namespace ? parseAll({ text: action.props.namespace, ...ctx }) : undefined
  const syntheticProjectPrepared = action.props.syntheticProject
    ? parseAll({ text: action.props.syntheticProject, ...ctx })
    : undefined
  const apiGroupPrepared = action.props.apiGroup ? parseAll({ text: action.props.apiGroup, ...ctx }) : undefined
  const apiVersionPrepared = parseAll({ text: action.props.apiVersion, ...ctx })
  const pluralPrepared = parseAll({ text: action.props.plural, ...ctx })
  const namePrepared = parseAll({ text: action.props.name, ...ctx })
  const baseprefixPrepared = action.props.baseprefix ? parseAll({ text: action.props.baseprefix, ...ctx }) : undefined

  const url = buildEditUrl(
    {
      ...action.props,
      cluster: clusterPrepared,
      namespace: namespacePrepared,
      syntheticProject: syntheticProjectPrepared,
      apiGroup: apiGroupPrepared,
      apiVersion: apiVersionPrepared,
      plural: pluralPrepared,
      name: namePrepared,
      baseprefix: baseprefixPrepared,
    },
    fullPath,
  )
  navigate(url)
}

const handleDeleteAction = (
  action: Extract<TActionUnion, { type: 'delete' }>,
  ctx: TParseContext,
  setDeleteModalData: (data: TDeleteModalData) => void,
) => {
  const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
  const namePrepared = parseAll({ text: action.props.name, ...ctx })
  const redirectToPrepared = action.props.redirectTo ? parseAll({ text: action.props.redirectTo, ...ctx }) : undefined

  setDeleteModalData({
    name: namePrepared,
    endpoint: endpointPrepared,
    redirectTo: redirectToPrepared,
  })
}

const handlePatchActions = (
  action: Extract<TActionUnion, { type: 'cordon' | 'uncordon' | 'suspend' | 'resume' }>,
  ctx: TParseContext,
  onSuccess: (label: string) => void,
  onError: (label: string, error: unknown) => void,
) => {
  const actionLabel = action.props.text || action.type
  const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
  const pathToValuePrepared = parseAll({ text: action.props.pathToValue, ...ctx })
  const valuePrepared = parseValueIfString(action.props.value, ctx)

  patchEntryWithReplaceOp({
    endpoint: endpointPrepared,
    pathToValue: pathToValuePrepared,
    body: valuePrepared,
  })
    .then(() => onSuccess(actionLabel))
    .catch(error => {
      onError(actionLabel, error)
      // eslint-disable-next-line no-console
      console.error(error)
    })
}

const handleRolloutRestartAction = (
  action: Extract<TActionUnion, { type: 'rolloutRestart' }>,
  ctx: TParseContext,
  onSuccess: (label: string) => void,
  onError: (label: string, error: unknown) => void,
) => {
  const actionLabel = action.props.text || 'Rollout restart'
  const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
  const annotationKeyPrepared = action.props.annotationKey
    ? parseAll({ text: action.props.annotationKey, ...ctx })
    : 'kubectl.kubernetes.io/restartedAt'
  const timestampPrepared = action.props.timestamp
    ? parseAll({ text: action.props.timestamp, ...ctx })
    : new Date().toISOString()

  patchEntryWithMergePatch({
    endpoint: endpointPrepared,
    body: {
      spec: {
        template: {
          metadata: {
            annotations: {
              [annotationKeyPrepared]: timestampPrepared,
            },
          },
        },
      },
    },
  })
    .then(() => onSuccess(actionLabel))
    .catch(error => {
      onError(actionLabel, error)
      // eslint-disable-next-line no-console
      console.error(error)
    })
}

const handleOpenKubeletConfigAction = (
  action: Extract<TActionUnion, { type: 'openKubeletConfig' }>,
  ctx: TParseContext,
  setActiveAction: (action: TActionUnion) => void,
  setModalOpen: (open: boolean) => void,
) => {
  const urlPrepared = parseAll({ text: action.props.url, ...ctx })
  const modalTitlePrepared = action.props.modalTitle ? parseAll({ text: action.props.modalTitle, ...ctx }) : undefined
  const modalDescriptionTextPrepared = action.props.modalDescriptionText
    ? parseAll({ text: action.props.modalDescriptionText, ...ctx })
    : undefined

  setActiveAction({
    ...action,
    props: {
      ...action.props,
      url: urlPrepared,
      modalTitle: modalTitlePrepared,
      modalDescriptionText: modalDescriptionTextPrepared,
    },
  })
  setModalOpen(true)
}

const generateDnsCompliantName = (prefix: string, maxLength = 63): string => {
  const timestamp = Date.now()
  const randomHex = Math.random().toString(16).substring(2, 6)
  const suffix = `-${timestamp}-${randomHex}`
  const truncatedPrefix = prefix.substring(0, maxLength - suffix.length)
  return `${truncatedPrefix}${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

const JOB_MANAGED_LABEL_KEYS = [
  'controller-uid',
  'job-name',
  'batch.kubernetes.io/controller-uid',
  'batch.kubernetes.io/job-name',
]

const stripManagedJobLabels = (labels: unknown): Record<string, unknown> | undefined => {
  if (!labels || typeof labels !== 'object' || Array.isArray(labels)) {
    return undefined
  }

  const cleaned = { ...(labels as Record<string, unknown>) }
  JOB_MANAGED_LABEL_KEYS.forEach(key => delete cleaned[key])

  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

export const stripMetadataForRerun = (
  sourceObj: Record<string, unknown>,
  sourceJobName: string,
): Record<string, unknown> => {
  // Support both full Job object and spec-only shape (e.g. CCO `reqs[0]['spec']`).
  const normalizedSourceObj = _.isPlainObject(_.get(sourceObj, 'spec'))
    ? sourceObj
    : _.isPlainObject(sourceObj) && _.isPlainObject(_.get(sourceObj, 'template'))
    ? { spec: sourceObj }
    : sourceObj

  const copy = JSON.parse(JSON.stringify(normalizedSourceObj)) as Record<string, unknown>

  // Clean metadata: keep only namespace, labels, annotations
  const oldMeta = (copy.metadata ?? {}) as Record<string, unknown>
  const cleanedMetadataLabels = stripManagedJobLabels(oldMeta.labels)
  copy.metadata = {
    ...(oldMeta.namespace ? { namespace: oldMeta.namespace } : {}),
    ...(cleanedMetadataLabels ? { labels: cleanedMetadataLabels } : {}),
    ...(oldMeta.annotations ? { annotations: oldMeta.annotations } : {}),
    generateName: `${sourceJobName}-rerun-`,
  }

  // Clean Job controller-managed fields that cannot be reused on create
  const spec = _.get(copy, 'spec')
  if (_.isPlainObject(spec)) {
    const specObj = spec as Record<string, unknown>
    delete specObj.selector
    delete specObj.manualSelector
  }

  const templateLabels = _.get(copy, 'spec.template.metadata.labels')
  if (_.isPlainObject(templateLabels)) {
    const cleanedTemplateLabels = stripManagedJobLabels(templateLabels)
    if (cleanedTemplateLabels) {
      _.set(copy, 'spec.template.metadata.labels', cleanedTemplateLabels)
    } else {
      _.unset(copy, 'spec.template.metadata.labels')
    }
  }

  // Remove status entirely
  delete copy.status

  return copy
}

type TNotificationCallbacks = {
  showSuccess: (label: string) => void
  showError: (label: string, error: unknown) => void
}

const useScaleHandlers = (ctx: TParseContext, { showSuccess, showError }: TNotificationCallbacks) => {
  const [scaleModalData, setScaleModalData] = useState<TScaleModalData | null>(null)
  const [isScaleLoading, setIsScaleLoading] = useState(false)

  const handleScaleAction = (action: Extract<TActionUnion, { type: 'scale' }>) => {
    const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
    const namePrepared = parseAll({ text: action.props.name, ...ctx })
    const namespacePrepared = action.props.namespace ? parseAll({ text: action.props.namespace, ...ctx }) : undefined
    const apiVersionPrepared = action.props.apiVersion
      ? parseAll({ text: action.props.apiVersion, ...ctx })
      : 'autoscaling/v1'
    const currentReplicasStr = parseAll({ text: action.props.currentReplicas, ...ctx })
    const currentReplicas = parseInt(currentReplicasStr, 10) || 0

    setScaleModalData({
      endpoint: endpointPrepared,
      currentReplicas,
      name: namePrepared,
      namespace: namespacePrepared,
      apiVersion: apiVersionPrepared,
    })
  }

  const handleScaleConfirm = (newReplicas: number) => {
    if (!scaleModalData) return

    setIsScaleLoading(true)
    const body = {
      apiVersion: scaleModalData.apiVersion,
      kind: 'Scale',
      metadata: {
        name: scaleModalData.name,
        ...(scaleModalData.namespace ? { namespace: scaleModalData.namespace } : {}),
      },
      spec: { replicas: newReplicas },
    }

    const scaleLabel = `Scale ${scaleModalData.name}`

    updateEntry({ endpoint: scaleModalData.endpoint, body })
      .then(() => showSuccess(scaleLabel))
      .catch(error => {
        showError(scaleLabel, error)
        // eslint-disable-next-line no-console
        console.error(error)
      })
      .finally(() => {
        setIsScaleLoading(false)
        setScaleModalData(null)
      })
  }

  const handleScaleCancel = () => {
    setScaleModalData(null)
    setIsScaleLoading(false)
  }

  return { scaleModalData, isScaleLoading, handleScaleAction, handleScaleConfirm, handleScaleCancel }
}

const useEvictHandlers = ({ showSuccess, showError }: TNotificationCallbacks) => {
  const [evictModalData, setEvictModalData] = useState<TEvictModalData | null>(null)
  const [isEvictLoading, setIsEvictLoading] = useState(false)

  const handleEvictConfirm = () => {
    if (!evictModalData) return

    setIsEvictLoading(true)
    const body = buildEvictBody(evictModalData)
    const evictLabel = `Evict ${evictModalData.name}`

    createNewEntry({ endpoint: evictModalData.endpoint, body })
      .then(() => showSuccess(evictLabel))
      .catch(error => {
        showError(evictLabel, error)
        // eslint-disable-next-line no-console
        // console.error(error)
      })
      .finally(() => {
        setIsEvictLoading(false)
        setEvictModalData(null)
      })
  }

  const handleEvictCancel = () => {
    setEvictModalData(null)
    setIsEvictLoading(false)
  }

  return { evictModalData, isEvictLoading, setEvictModalData, handleEvictConfirm, handleEvictCancel }
}

const useRerunHandlers = (
  ctx: TParseContext,
  multiQueryData: Record<string, unknown>,
  { showSuccess, showError }: TNotificationCallbacks,
) => {
  const [rerunModalData, setRerunModalData] = useState<TRerunModalData | null>(null)
  const [isRerunLoading, setIsRerunLoading] = useState(false)

  const handleRerunLastAction = (action: Extract<TActionUnion, { type: 'rerunLast' }>) => {
    const createEndpointPrepared = parseAll({ text: action.props.createEndpoint, ...ctx })
    const sourceJobNamePrepared = parseAll({ text: action.props.sourceJobName, ...ctx })

    const sourceJobObj = resolveObjectFromTemplate(action.props.sourceJobSpec, multiQueryData) as
      | Record<string, unknown>
      | undefined

    if (!sourceJobObj) {
      showError('Rerun job', new Error('Could not resolve source job spec from resource data'))
      return
    }

    setRerunModalData({
      createEndpoint: createEndpointPrepared,
      sourceName: sourceJobNamePrepared,
      sourceSpec: sourceJobObj,
    })
  }

  const handleRerunConfirm = () => {
    if (!rerunModalData) return

    setIsRerunLoading(true)
    const body = stripMetadataForRerun(rerunModalData.sourceSpec, rerunModalData.sourceName)
    const rerunLabel = `Rerun ${rerunModalData.sourceName}`

    createNewEntry({ endpoint: rerunModalData.createEndpoint, body })
      .then(() => showSuccess(rerunLabel))
      .catch(error => {
        showError(rerunLabel, error)
        // eslint-disable-next-line no-console
        console.error(error)
      })
      .finally(() => {
        setIsRerunLoading(false)
        setRerunModalData(null)
      })
  }

  const handleRerunCancel = () => {
    setRerunModalData(null)
    setIsRerunLoading(false)
  }

  return { rerunModalData, isRerunLoading, handleRerunLastAction, handleRerunConfirm, handleRerunCancel }
}

const fireTriggerRunAction = (
  action: Extract<TActionUnion, { type: 'triggerRun' }>,
  ctx: TParseContext,
  multiQueryData: Record<string, unknown>,
  { showSuccess, showError }: TNotificationCallbacks,
) => {
  const createEndpointPrepared = parseAll({ text: action.props.createEndpoint, ...ctx })
  const cronJobNamePrepared = parseAll({ text: action.props.cronJobName, ...ctx })

  const jobTemplateObj = resolveObjectFromTemplate(action.props.jobTemplate, multiQueryData) as
    | Record<string, unknown>
    | undefined

  if (!jobTemplateObj) {
    showError('Trigger run', new Error('Could not resolve job template from resource data'))
    return
  }

  const jobName = generateDnsCompliantName(`${cronJobNamePrepared}-manual`)

  const namespaceParsed = cronJobNamePrepared
    ? (_.get(jobTemplateObj, ['metadata', 'namespace']) as string | undefined)
    : undefined

  const body = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName,
      ...(namespaceParsed ? { namespace: namespaceParsed } : {}),
      annotations: {
        'cronjob.kubernetes.io/instantiate': 'manual',
      },
    },
    spec: (jobTemplateObj as Record<string, unknown>).spec,
  }

  const triggerLabel = `Trigger run for ${cronJobNamePrepared}`

  createNewEntry({ endpoint: createEndpointPrepared, body })
    .then(() => showSuccess(triggerLabel))
    .catch(error => {
      showError(triggerLabel, error)
      // eslint-disable-next-line no-console
      console.error(error)
    })
}

export const useActionsDropdownHandlers = ({ replaceValues, multiQueryData }: TParseContext) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const fullPath = location.pathname + location.search

  const [activeAction, setActiveAction] = useState<TActionUnion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalData, setDeleteModalData] = useState<TDeleteModalData | null>(null)
  const [deleteChildrenModalData, setDeleteChildrenModalData] = useState<TDeleteChildrenModalData | null>(null)

  const invalidateMultiQuery = () => {
    queryClient.invalidateQueries({ queryKey: ['multi'] })
  }

  const showSuccess = (actionLabel: string) => {
    invalidateMultiQuery()
    notificationApi.success({
      message: `${actionLabel} successful`,
      placement: 'bottomRight',
    })
  }

  const getErrorDescription = (error: unknown): string => {
    if (error instanceof AxiosError) {
      return error.response?.data?.message || error.message
    }
    if (error instanceof Error) {
      return error.message
    }
    return 'Unknown error'
  }

  const showError = (actionLabel: string, error: unknown) => {
    notificationApi.error({
      message: `${actionLabel} failed`,
      description: getErrorDescription(error),
      placement: 'bottomRight',
    })
  }

  const ctx: TParseContext = { replaceValues, multiQueryData }
  const notificationCallbacks: TNotificationCallbacks = { showSuccess, showError }

  const { scaleModalData, isScaleLoading, handleScaleAction, handleScaleConfirm, handleScaleCancel } = useScaleHandlers(
    ctx,
    notificationCallbacks,
  )
  const { evictModalData, isEvictLoading, setEvictModalData, handleEvictConfirm, handleEvictCancel } =
    useEvictHandlers(notificationCallbacks)
  const { rerunModalData, isRerunLoading, handleRerunLastAction, handleRerunConfirm, handleRerunCancel } =
    useRerunHandlers(ctx, multiQueryData, notificationCallbacks)

  // --- DeleteChildren handlers ---
  const handleDeleteChildrenAction = (action: Extract<TActionUnion, { type: 'deleteChildren' }>) => {
    try {
      const data = buildDeleteChildrenData(action, ctx)
      setDeleteChildrenModalData(data)
    } catch (error) {
      const childResourceNamePrepared = parseAll({ text: action.props.childResourceName, ...ctx })
      showError(`Delete ${childResourceNamePrepared}`, error)
    }
  }

  const handleDeleteChildrenClose = () => {
    setDeleteChildrenModalData(null)
    invalidateMultiQuery()
  }

  const handleActionClick = (action: TActionUnion) => {
    if (action.type === 'edit') {
      handleEditAction(action, ctx, fullPath, navigate)
      return
    }

    if (action.type === 'delete') {
      handleDeleteAction(action, ctx, setDeleteModalData)
      return
    }

    if (
      action.type === 'cordon' ||
      action.type === 'uncordon' ||
      action.type === 'suspend' ||
      action.type === 'resume'
    ) {
      handlePatchActions(action, ctx, showSuccess, showError)
      return
    }

    if (action.type === 'rolloutRestart') {
      handleRolloutRestartAction(action, ctx, showSuccess, showError)
      return
    }

    if (action.type === 'evict') {
      const evictData = buildEvictModalData(action.props, ctx)
      setEvictModalData(evictData)
      return
    }

    if (action.type === 'openKubeletConfig') {
      handleOpenKubeletConfigAction(action, ctx, setActiveAction, setModalOpen)
      return
    }

    if (action.type === 'scale') {
      handleScaleAction(action)
      return
    }

    if (action.type === 'triggerRun') {
      fireTriggerRunAction(action, ctx, multiQueryData, notificationCallbacks)
      return
    }

    if (action.type === 'deleteChildren') {
      handleDeleteChildrenAction(action)
      return
    }

    if (action.type === 'rerunLast') {
      handleRerunLastAction(action)
      return
    }

    // Phase 2: drain and rollback are no-ops for now
    if (action.type === 'drain' || action.type === 'rollback') {
      return
    }

    setActiveAction(action)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setActiveAction(null)
  }

  const handleDeleteModalClose = () => {
    // Smart redirect logic:
    // 1. If redirectTo was provided, use it
    // 2. Else if backlink exists in URL, use it
    // 3. Else just close (table behavior)
    const redirectTo = deleteModalData?.redirectTo
    const backlink = searchParams.get('backlink')

    setDeleteModalData(null)

    if (redirectTo) {
      navigate(redirectTo)
    } else if (backlink) {
      navigate(decodeURIComponent(backlink))
    }
    // else: no navigation, just close modal (table context)
  }

  return {
    notificationContextHolder,
    activeAction,
    modalOpen,
    deleteModalData,
    evictModalData,
    isEvictLoading,
    scaleModalData,
    isScaleLoading,
    deleteChildrenModalData,
    rerunModalData,
    isRerunLoading,
    handleActionClick,
    handleCloseModal,
    handleDeleteModalClose,
    handleEvictConfirm,
    handleEvictCancel,
    handleScaleConfirm,
    handleScaleCancel,
    handleDeleteChildrenClose,
    handleRerunConfirm,
    handleRerunCancel,
  }
}
