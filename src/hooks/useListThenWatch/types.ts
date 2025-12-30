// ========================= Types ============================
// Messages are intentionally permissive (no k8s deps).
import { TSingleResource } from 'localTypes/k8s'

type TWatchPhase = 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK'

// ====================== Server Frames =======================
// Incoming frames from the server. Your backend should emit one of these.
// INITIAL: first page (newest events) + a `continue` token
// PAGE: older page fetched via SCROLL
// PAGE_ERROR: pagination failed (keep live stream running)
// ADDED/MODIFIED/DELETED: watch-style deltas for live updates

type TInitialFrame = {
  type: 'INITIAL'
  items: TSingleResource[]
  continue?: string
  remainingItemCount?: number
  resourceVersion?: string
}

type TPageFrame = {
  type: 'PAGE'
  items: TSingleResource[]
  continue?: string
  remainingItemCount?: number
}

type TPageErrorFrame = {
  type: 'PAGE_ERROR'
  error: string
}

type TDeltaFrame = {
  type: TWatchPhase // ADDED | MODIFIED | DELETED
  item: TSingleResource
}

type TConsoleFrame = {
  type: 'SERVER_LOG'
  level: 'info' | 'warn' | 'error'
  message: string
}

type TInitialError = {
  type: 'INITIAL_ERROR'
  message: string
}

export type TServerFrame = TInitialFrame | TPageFrame | TPageErrorFrame | TDeltaFrame | TConsoleFrame | TInitialError

// Outgoing scroll request to server
// Sent when the bottom sentinel intersects view and `continue` exists.

export type TScrollMsg = {
  type: 'SCROLL'
  continue: string
  limit?: number
}
