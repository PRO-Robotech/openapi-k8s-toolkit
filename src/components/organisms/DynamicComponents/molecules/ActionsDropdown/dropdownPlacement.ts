export type TActionsDropdownPlacement = 'bottomLeft' | 'topLeft'

export type TComputeActionsDropdownPlacementParams = {
  triggerTop: number
  triggerBottom: number
  viewportHeight: number
  actionsCount: number
}

const VIEWPORT_MARGIN_PX = 12
const ITEM_HEIGHT_ESTIMATE_PX = 40
const MENU_VERTICAL_PADDING_PX = 8
const MIN_MENU_HEIGHT_PX = 140
const MAX_MENU_HEIGHT_PX = 420

export const DEFAULT_MENU_MAX_HEIGHT_PX = 320

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const getDropdownPlacement = ({
  triggerTop,
  triggerBottom,
  viewportHeight,
  actionsCount,
}: TComputeActionsDropdownPlacementParams): {
  placement: TActionsDropdownPlacement
  maxMenuHeightPx: number
} => {
  const safeActionsCount = Number.isFinite(actionsCount) ? Math.max(0, actionsCount) : 0

  if (!isFiniteNumber(triggerTop) || !isFiniteNumber(triggerBottom) || !isFiniteNumber(viewportHeight)) {
    return { placement: 'bottomLeft', maxMenuHeightPx: DEFAULT_MENU_MAX_HEIGHT_PX }
  }

  const estimatedMenuHeight = safeActionsCount * ITEM_HEIGHT_ESTIMATE_PX + MENU_VERTICAL_PADDING_PX
  const spaceAbove = Math.max(0, Math.floor(triggerTop - VIEWPORT_MARGIN_PX))
  const spaceBelow = Math.max(0, Math.floor(viewportHeight - triggerBottom - VIEWPORT_MARGIN_PX))

  const shouldOpenUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow
  const placement: TActionsDropdownPlacement = shouldOpenUp ? 'topLeft' : 'bottomLeft'
  const availableSpace = shouldOpenUp ? spaceAbove : spaceBelow

  if (availableSpace <= 0) {
    return { placement, maxMenuHeightPx: DEFAULT_MENU_MAX_HEIGHT_PX }
  }

  const maxMenuHeightPx =
    availableSpace < MIN_MENU_HEIGHT_PX ? availableSpace : clamp(availableSpace, MIN_MENU_HEIGHT_PX, MAX_MENU_HEIGHT_PX)

  return { placement, maxMenuHeightPx }
}
