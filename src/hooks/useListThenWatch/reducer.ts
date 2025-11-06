// ------------------------------------------------------------
// Reducer to maintain a keyed list of events, supporting ADDED/MODIFIED/DELETED
// ------------------------------------------------------------
// We keep an `order` array for display order (newest first) and a `byKey` map
// for O(1) updates/reads. Pages append to the END (older items), while live
// UPSERTs (ADDED/MODIFIED) unshift to the START if new.
import { TSingleResource } from 'localTypes/k8s'
import { eventKey } from './utils'

type TState = {
  order: string[] // list of keys (newest first)
  byKey: Record<string, TSingleResource>
}

type TAction =
  | { type: 'RESET'; items: TSingleResource[] }
  | { type: 'APPEND_PAGE'; items: TSingleResource[] } // for older pages (append to end)
  | { type: 'UPSERT'; item: TSingleResource } // ADDED/MODIFIED
  | { type: 'REMOVE'; key: string } // DELETED

export const reducer = (state: TState, action: TAction): TState => {
  switch (action.type) {
    case 'RESET': {
      // Replace everything with the initial payload (usually newest N)
      const order = action.items.map(eventKey)
      const byKey: TState['byKey'] = {}
      // eslint-disable-next-line no-return-assign
      action.items.forEach(it => (byKey[eventKey(it)] = it))
      return { order, byKey }
    }
    case 'APPEND_PAGE': {
      // Append only truly new keys to the end; update any items that already exist
      const next = { ...state.byKey }
      const addKeys: string[] = []
      action.items.forEach(it => {
        const k = eventKey(it)
        if (!next[k]) addKeys.push(k)
        next[k] = it
      })
      return { order: [...state.order, ...addKeys], byKey: next }
    }
    case 'UPSERT': {
      // Insert new items at the front; replace existing in-place
      const k = eventKey(action.item)
      const exists = Boolean(state.byKey[k])
      const byKey = { ...state.byKey, [k]: action.item }
      const order = exists ? state.order : [k, ...state.order]
      return { order, byKey }
    }
    case 'REMOVE': {
      // Remove from map and order if present
      if (!state.byKey[action.key]) return state
      const byKey = { ...state.byKey }
      delete byKey[action.key]
      return { order: state.order.filter(k => k !== action.key), byKey }
    }
    default:
      return state
  }
}
