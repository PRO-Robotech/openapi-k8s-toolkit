import _ from 'lodash'
import { createNewEntry, patchEntryWithMergePatch, patchEntryWithReplaceOp } from 'api/forms'
import { parseAll } from '../../../utils'
import { buildEditUrl } from '../../utils'
import type { TActionUnion } from '../../../../types/ActionsDropdown'
import { generateDnsCompliantName, parseValueIfString, resolveObjectFromTemplate } from './helpers'
import type { TDeleteModalData, TNotificationCallbacks, TParseContext } from './types'

export const handleEditAction = (
  action: Extract<TActionUnion, { type: 'edit' }>,
  ctx: TParseContext,
  fullPath: string,
  navigate: (url: string) => void,
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

export const handleDeleteAction = (
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

export const handlePatchActions = (
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
    })
}

export const handleRolloutRestartAction = (
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
    })
}

export const handleOpenKubeletConfigAction = (
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

export const fireTriggerRunAction = (
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
    })
}

export const handleDownloadAsFilesAction = (
  action: Extract<TActionUnion, { type: 'downloadAsFiles' }>,
  ctx: TParseContext,
  setActiveAction: (action: TActionUnion) => void,
  setModalOpen: (open: boolean) => void,
) => {
  const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
  const namePrepared = parseAll({ text: action.props.name, ...ctx })

  setActiveAction({
    ...action,
    props: {
      ...action.props,
      endpoint: endpointPrepared,
      name: namePrepared,
    },
  })
  setModalOpen(true)
}
