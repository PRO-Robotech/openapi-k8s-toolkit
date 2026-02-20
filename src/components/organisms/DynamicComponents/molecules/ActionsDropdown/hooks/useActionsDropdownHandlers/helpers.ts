import React from 'react'
import _ from 'lodash'
import { parseAll, parseWithoutPartsOfUrl, parsePartsOfUrl } from '../../../utils'
import type { TActionUnion, TEvictActionProps } from '../../../../types/ActionsDropdown'
import type { TDeleteChildrenModalData, TDrainResponse, TEvictModalData, TParseContext } from './types'

export const parseValueIfString = (value: unknown, ctx: TParseContext) => {
  if (typeof value === 'string') {
    return parseAll({ text: value, ...ctx })
  }
  return value
}

/**
 * Resolves a multiQuery template path like "{reqs[0]['spec','jobTemplate']}" to the actual JS object.
 */
export const resolveObjectFromTemplate = (template: string, multiQueryData: Record<string, unknown>): unknown => {
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

export const generateDnsCompliantName = (prefix: string, maxLength = 63): string => {
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
  let normalizedSourceObj = sourceObj
  if (_.isPlainObject(_.get(sourceObj, 'spec'))) {
    normalizedSourceObj = sourceObj
  } else if (_.isPlainObject(sourceObj) && _.isPlainObject(_.get(sourceObj, 'template'))) {
    normalizedSourceObj = { spec: sourceObj }
  }

  const copy = JSON.parse(JSON.stringify(normalizedSourceObj)) as Record<string, unknown>

  const oldMeta = (copy.metadata ?? {}) as Record<string, unknown>
  const cleanedMetadataLabels = stripManagedJobLabels(oldMeta.labels)
  copy.metadata = {
    ...(oldMeta.namespace ? { namespace: oldMeta.namespace } : {}),
    ...(cleanedMetadataLabels ? { labels: cleanedMetadataLabels } : {}),
    ...(oldMeta.annotations ? { annotations: oldMeta.annotations } : {}),
    generateName: `${sourceJobName}-rerun-`,
  }

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

  delete copy.status

  return copy
}

const MAX_FAILED_PODS_SHOWN = 5

export const buildDrainFailureDescription = ({ drained, failed, skipped }: TDrainResponse): React.ReactNode => {
  const lines: React.ReactNode[] = [`Evicted ${drained}, skipped ${skipped}, failed ${failed.length}`]

  const shown = failed.slice(0, MAX_FAILED_PODS_SHOWN)
  shown.forEach(pod => {
    lines.push(React.createElement('br', null), `${pod.namespace}/${pod.name}: ${pod.error}`)
  })

  if (failed.length > MAX_FAILED_PODS_SHOWN) {
    lines.push(React.createElement('br', null), `+${failed.length - MAX_FAILED_PODS_SHOWN} more`)
  }

  return React.createElement(React.Fragment, null, ...lines)
}
