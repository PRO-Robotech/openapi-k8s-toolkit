import { useState } from 'react'
import { createNewEntry } from 'api/forms'
import { buildEvictBody } from '../helpers'
import type { TEvictModalData, TNotificationCallbacks } from '../types'

export const useEvictHandlers = ({ showSuccess, showError }: TNotificationCallbacks) => {
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
