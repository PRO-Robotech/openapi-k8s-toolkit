// ========================= Types ============================
// Messages are intentionally permissive (no k8s deps).

type TWatchPhase = 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK'

// Shape of an events.k8s.io/v1 Event (subset)
// Note: Both modern `note` and legacy `message` are supported for text.
// Only the fields we render / key on are listed here.

export type TEventsV1Event = {
  metadata?: {
    name?: string
    namespace?: string
    resourceVersion?: string
    creationTimestamp?: string
  }
  type?: string // Normal | Warning
  reason?: string
  note?: string // message text in events.k8s.io/v1
  message?: string // legacy fallback
  reportingController?: string
  reportingInstance?: string
  deprecatedCount?: number
  deprecatedFirstTimestamp?: Date
  action?: string
  eventTime?: string
  regarding?: {
    apiVersion?: string
    kind?: string
    name?: string
    namespace?: string
  }
  deprecatedSource?: {
    component?: string
    host?: string
  }
}

// ====================== Server Frames =======================
// Incoming frames from the server. Your backend should emit one of these.
// INITIAL: first page (newest events) + a `continue` token
// PAGE: older page fetched via SCROLL
// PAGE_ERROR: pagination failed (keep live stream running)
// ADDED/MODIFIED/DELETED: watch-style deltas for live updates

type TInitialFrame = {
  type: 'INITIAL'
  items: TEventsV1Event[]
  continue?: string
  remainingItemCount?: number
  resourceVersion?: string
}

type TPageFrame = {
  type: 'PAGE'
  items: TEventsV1Event[]
  continue?: string
  remainingItemCount?: number
}

type TPageErrorFrame = {
  type: 'PAGE_ERROR'
  error: string
}

type TDeltaFrame = {
  type: TWatchPhase // ADDED | MODIFIED | DELETED
  item: TEventsV1Event
}

export type TServerFrame = TInitialFrame | TPageFrame | TPageErrorFrame | TDeltaFrame

// Outgoing scroll request to server
// Sent when the bottom sentinel intersects view and `continue` exists.

export type TScrollMsg = {
  type: 'SCROLL'
  continue: string
  limit?: number
}
