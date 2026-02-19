import { useState } from 'react'
import axios from 'axios'
import type { NotificationInstance } from 'antd/es/notification/interface'
import { parseAll } from '../../../../utils'
import type { TActionUnion } from '../../../../../types/ActionsDropdown'
import { buildDrainFailureDescription } from '../helpers'
import type { TDrainModalData, TDrainResponse, TNotificationCallbacks, TParseContext } from '../types'

export const useDrainHandlers = (
  ctx: TParseContext,
  { showError }: Pick<TNotificationCallbacks, 'showError'>,
  notificationApi: NotificationInstance,
  invalidateMultiQuery: () => void,
) => {
  const [drainModalData, setDrainModalData] = useState<TDrainModalData | null>(null)
  const [isDrainLoading, setIsDrainLoading] = useState(false)

  const handleDrainAction = (action: Extract<TActionUnion, { type: 'drain' }>) => {
    const bffEndpointPrepared = parseAll({ text: action.props.bffEndpoint, ...ctx })
    const nodeNamePrepared = parseAll({ text: action.props.nodeName, ...ctx })
    setDrainModalData({ bffEndpoint: bffEndpointPrepared, nodeName: nodeNamePrepared })
  }

  const handleDrainConfirm = () => {
    if (!drainModalData) return

    setIsDrainLoading(true)
    const drainLabel = `Drain ${drainModalData.nodeName}`

    axios
      .post<TDrainResponse>(drainModalData.bffEndpoint, {
        nodeName: drainModalData.nodeName,
        apiPath: `/api/v1/nodes/${drainModalData.nodeName}`,
      })
      .then(response => {
        invalidateMultiQuery()
        const { drained, failed, skipped } = response.data

        if (failed.length > 0) {
          notificationApi.warning({
            message: `${drainLabel} partially completed`,
            description: buildDrainFailureDescription({ drained, failed, skipped }),
            placement: 'bottomRight',
            duration: 0,
          })
        } else {
          notificationApi.success({
            message: `${drainLabel} successful`,
            description: `Evicted ${drained} pod(s), skipped ${skipped}`,
            placement: 'bottomRight',
          })
        }
      })
      .catch(error => {
        showError(drainLabel, error)
      })
      .finally(() => {
        setIsDrainLoading(false)
        setDrainModalData(null)
      })
  }

  const handleDrainCancel = () => {
    setDrainModalData(null)
    setIsDrainLoading(false)
  }

  return { drainModalData, isDrainLoading, handleDrainAction, handleDrainConfirm, handleDrainCancel }
}
