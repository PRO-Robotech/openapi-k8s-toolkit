# `useListWatch` — React Hook README

A resilient React hook for consuming a **“list → then watch”** WebSocket stream (e.g., from a Kubernetes-style API). It:

- Opens a WS, sends paging requests, and applies incremental updates
- Normalizes items into `{ order: string[]; byKey: Record<string, TSingleResource> }`
- Tracks `resourceVersion` (RV) to resume reliably
- Supports pause, ignore deletes, auto-drain paging, manual reconnect, and feature gating

---

## How it works

1. **Connects** to `wsUrl` (auto-upgrades `http(s)` → `ws(s)`; supports relative paths).
2. Sends query params: `apiGroup`, `apiVersion`, `plural`, `namespace`, `fieldSelector`, `labelSelector`, `initialLimit`, `initialContinue`.
   If a local RV anchor exists, includes `sinceRV`.
3. **Receives**:

   - `INITIAL` → resets state with snapshot, stores `_continue`, tracks `resourceVersion` anchor.
   - `PAGE` → appends items, updates `_continue`.
   - `ADDED` / `MODIFIED` / `DELETED` → applies live updates (unless `paused` / `ignoreRemove`).
   - `SERVER_LOG` → console logs from server.

4. **Paging**: call `sendScroll()` to fetch next page; `drainAll()` loops pages (bounded by `maxPages`/`maxItems`).
5. **Reconnects** on close with **exponential backoff** (750ms → 12s, with jitter). Manual `reconnect()` cancels backoff.
6. **RV anchoring**: tracks the **highest** RV seen (from `INITIAL`, `PAGE`, or events). On URL/query change, the anchor resets.

---

## Normalized state

- `state.order`: ordered array of stable keys (`eventKey(item)`).
- `state.byKey`: map of key → item.
- `total`: `state.order.length`.

---

## Connection controls

- `isEnabled`: when false, socket is closed and `status` becomes `closed`.
- `setUrl(url)`: change target; respects `preserveStateOnUrlChange`.
- `setQuery(q)`: update filters; resets RV anchor and reconnects when effective identity changes.
- `setPaused(bool)`: buffer (don’t apply) live updates while paused.
- `setIgnoreRemove(bool)`: ignore `DELETED` events.

---

## RV handling details

The hook tries to read `resourceVersion` in this order:

1. `getRV(item)` (your util; override point)
2. `item.resourceVersion`
3. `item.metadata.resourceVersion`

It tracks the **max** RV seen (using `compareRV`) to anchor the stream:

- After `INITIAL`/`PAGE`, anchor = snapshot max RV
- After events, anchor advances to event RV if larger
- On resubscribe, the URL includes `sinceRV=<anchor>`

---

## Error & status reporting

- `status`: `'connecting' | 'open' | 'closed'`
- `lastError`: last emitted error message (cleared on successful transitions)
- `onStatus`, `onError`: observers for side effects/telemetry

---

## Options that affect UX

- `autoDrain`: loads all pages after snapshot (fire-and-forget). Good for “complete view” before live events.
- `preserveStateOnUrlChange`:

  - `true` (default): keep items when `wsUrl`/`query` changes; only the stream changes.
  - `false`: clear items, tokens, and RV anchor on change.

- `pageSize`: recommended to mirror server `limit` to avoid very small pages.

---

## Edge cases & notes

- **SSR:** This hook uses `window` and WebSocket; call only on the client.
- **Backoff resets** on successful open; manual `reconnect()` suppresses transient error toasts.
- **Scrolling guards** prevent concurrent `SCROLL` messages.
- **State growth:** If the watch runs long, consider pruning or capping retained items in your `reducer`.
- **Keys & equality:** Ensure `eventKey(item)` is stable across pages and events; otherwise you’ll see duplicates.

---

## Troubleshooting

- **Stuck at “connecting”**
  Check `wsUrl` scheme/host and CORS/proxy rules. If you passed `http(s)`, the hook will auto-convert to `ws(s)`—verify that endpoint exists.

- **No items but no errors**
  Verify `labelSelector`/`fieldSelector`, RBAC on the server, and that the server sends `INITIAL`.

- **Repeating items**
  Your `eventKey` may be unstable; ensure it uniquely identifies an object across list + watch.

- **Flickering errors on URL/query change**
  Set `preserveStateOnUrlChange: true` (default) and note that the hook suppresses error toasts during intentional reconnects.

---

gotcha — let’s break down exactly what each of those refs does, why it’s a `useRef` (not `useState`), who writes to it, who reads it, and when it resets.

# What each ref is for (and why it’s a ref)

| Ref                   | Type                                 | Purpose                                                                                                                                            | Written by                                             | Read by                                                       | Reset when                                               |
| --------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- |
| `queryRef`            | `useRef<TUseListWatchQuery>`         | The **latest query** (namespace, selectors, etc.). Stored outside React state so message handlers always see the current query without re-binding. | `setQuery`, effect on `resId` change, initial mount    | `buildWsUrl` (when opening), any place we need current params | On URL/query changes that change `resId`                 |
| `wsRef`               | `useRef<WebSocket \| null>`          | The **live WebSocket instance**. You can close/destroy it without causing a render.                                                                | `connect` (set), `closeWS` / cleanup (clear)           | `sendScroll`, `drainAll`, event handlers                      | On reconnects and unmount                                |
| `connectingRef`       | `useRef<boolean>`                    | “Are we **currently trying to connect**?” Avoids double-connect storms when effects race.                                                          | `connect` (set/clear), `scheduleReconnect`             | `connect` (guard), `scheduleReconnect`                        | After successful `open` or after `close` handling        |
| `mountedRef`          | `useRef<boolean>`                    | Tracks if the component is **still mounted**. Prevents setting state after unmount.                                                                | mount/unmount effect                                   | any async callback before setState                            | On unmount (set to false)                                |
| `startedRef`          | `useRef<boolean>`                    | Ensures the **startup effect** runs only once.                                                                                                     | mount effect                                           | mount effect guard                                            | On unmount (set false)                                   |
| `reconnectTimerRef`   | `useRef<number \| null>`             | The **pending backoff timer id** (from `setTimeout`) for auto-reconnect.                                                                           | `scheduleReconnect` (set), `reconnect`/cleanup (clear) | `reconnect`/cleanup (to clear)                                | When reconnect fires or is canceled                      |
| `backoffRef`          | `useRef<number>`                     | Current **backoff delay** (ms). Starts 750, doubles up to 12s with jitter.                                                                         | `scheduleReconnect` (update), reset on `open`          | `scheduleReconnect`                                           | On successful `open` (reset to 750)                      |
| `urlRef`              | `useRef<string>`                     | The **effective ws URL** to dial next. Lets you call `setUrl` without re-binding handlers.                                                         | `setUrl`, mount                                        | `buildWsUrl`, `connect`                                       | When `setUrl` is called                                  |
| `onMessageRef`        | `useRef<(ev: MessageEvent) => void>` | The **current message handler** function. Lets us replace logic without re-attaching `ws` listeners.                                               | effect that sets `onMessageRef.current`                | WS `'message'` listener (always calls the latest function)    | Every time the handler logic changes (effect updates it) |
| `connectRef`          | `useRef<() => void>`                 | Exposes the **latest `connect` function** to other callbacks (like timers) without stale closures.                                                 | effect after `connect` changes                         | `scheduleReconnect` (to call reconnect), external methods     | Whenever `connect` changes                               |
| `fetchingRef`         | `useRef<boolean>`                    | “Are we **already fetching** a page?” Prevents sending concurrent `SCROLL`s.                                                                       | `sendScroll` (set true), PAGE/ERROR handlers (false)   | `sendScroll`, `drainAll`                                      | After each PAGE/ERROR, on open                           |
| `anchorRVRef`         | `useRef<string \| undefined>`        | **Highest resourceVersion** we’ve seen (from INITIAL/PAGE/events). Used to send `sinceRV` on next connect.                                         | message handler updates; resets on resId change        | `buildWsUrl` (decides whether to include `sinceRV`)           | On effective resource change (resId change)              |
| `haveAnchorRef`       | `useRef<boolean>`                    | Whether we **have any RV anchor yet** (after first snapshot).                                                                                      | set to true after INITIAL (if RV found)                | `buildWsUrl`                                                  | Reset with `anchorRVRef`                                 |
| `enabledRef`          | `useRef<boolean>`                    | Mirrors `isEnabled` prop to **avoid races** inside timers/handlers.                                                                                | effect syncing prop → ref                              | `connect`, `scheduleReconnect`, guards in many places         | On `isEnabled` prop change                               |
| `intentionalCloseRef` | `useRef<boolean>`                    | Distinguish a **manual reconnect/close** from unexpected drops. Prevents auto-reconnect loops when you call `reconnect()`.                         | `reconnect` (set true before closing)                  | `scheduleReconnect` (if true, don’t auto-reconnect)           | After `close` event is processed                         |
| `suppressErrorsRef`   | `useRef<boolean>`                    | Temporarily **mute error toasts** during intentional reconnects or url/query changes.                                                              | `setUrl`, `setQuery`, `reconnect`                      | WS `'error'` handler (decides whether to emit)                | Cleared when connection opens or after INITIAL           |

# Why refs instead of state?

- **No re-renders**: These are coordination flags (timers, sockets, debouncing). Using `useState` would cause unnecessary renders and stale closures.
- **Stable identity**: Event listeners and timers capture values at bind time. Storing the _current_ function/data in `useRef` means listeners always read the latest value.
- **Race avoidance**: Things like `connectingRef`, `enabledRef`, `intentionalCloseRef` protect against double connects and unwanted auto-reconnects during manual operations.

# How they work together (timeline)

1. **Mount**

   - `startedRef` and `mountedRef` set; `connect()` runs if `isEnabled`.
   - `connect` builds URL via `urlRef` + `queryRef`, optionally adds `sinceRV` from `anchorRVRef`/`haveAnchorRef`.
   - `connectingRef = true`; `onMessageRef.current` is the latest handler.

2. **Open**

   - Backoff reset via `backoffRef = 750`; `fetchingRef = false`; status → `open`; `suppressErrorsRef = false`.

3. **INITIAL** message arrives

   - State `RESET` with items; paging token saved; `anchorRVRef` set to snapshot RV; `haveAnchorRef = true`.
   - If `autoDrain`, `drainAll()` starts sending `SCROLL` while guarding with `fetchingRef`.

4. **PAGE** messages

   - Append items, update `_continue`, refresh `anchorRVRef` to max RV in page, `fetchingRef = false`.

5. **Events (ADDED/MODIFIED/DELETED)**

   - Advance `anchorRVRef` if RV increases.
   - Apply to reducer unless `pausedRef` true; deletes skipped if `ignoreRemoveRef` true.

6. **Close/Error**

   - `'error'` may be muted if `suppressErrorsRef` or `intentionalCloseRef`.
   - `'close'` triggers `scheduleReconnect` unless `intentionalCloseRef` was set.
   - `scheduleReconnect` uses `backoffRef` with jitter, stores timer id in `reconnectTimerRef`.

7. **Manual `reconnect()`**

   - Sets `intentionalCloseRef = true`, cancels pending timer, closes current socket, then calls `connect()` immediately.

8. **URL/Query change**

   - `setUrl`/`setQuery` set `suppressErrorsRef = true`.
   - May clear state and RV anchor depending on `preserveStateOnUrlChange`.
   - If the **effective resource id** (`resId`) changed, reset `anchorRVRef`/`haveAnchorRef` and call `reconnect()`.

# Common pitfalls this block prevents

- **Double connects** (rapid effects): guarded by `connectingRef`.
- **Toast spam** during intentional reconnects: muted by `suppressErrorsRef`.
- **Reconnecting when you asked not to** (feature toggles): `enabledRef` checked everywhere.
- **Leaking timers**: `reconnectTimerRef` is always cleared on manual reconnect/unmount.
- **Stale handlers**: `onMessageRef` ensures the WS `'message'` listener always uses the newest logic.
