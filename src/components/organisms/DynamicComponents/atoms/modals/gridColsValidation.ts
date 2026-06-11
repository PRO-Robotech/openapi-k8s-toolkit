/**
 * The edit modals (Tolerations, Taints, Annotations) lay their fields out on Ant Design's 24-column grid,
 * with the column spans supplied by the factory YAML via a `cols` array. Each modal renders a FIXED number
 * of columns — Tolerations 5, Taints 4, Annotations 3 (each count includes the trailing actions column) —
 * and the spans must sum to 24 for the row to fill the modal width.
 *
 * `cols` is hand-authored YAML, so the compile-time tuple types don't protect against it. This validator
 * runs at render time and warns — without rewriting the author's values — when `cols` has the wrong length
 * or the spans don't sum to 24. A misconfigured grid then surfaces in the console instead of silently
 * producing a broken layout (columns that wrap, squash, or leave a gap on the right).
 *
 * `count` is intrinsic to each modal's structure; `ANTD_GRID_TOTAL` is Ant Design's fixed grid size.
 */
export const ANTD_GRID_TOTAL = 24

export type TGridColsValidationResult = { valid: true } | { valid: false; message: string }

type TGridColsSpec = {
  /** Component name for the warning message, e.g. "Tolerations". */
  component: string
  /** Exact number of columns the modal renders, including the trailing actions column. */
  count: number
  /** Human-readable column list for the message, e.g. "Key, Operator, Value, Effect, actions". */
  columns: string
}

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(item => typeof item === 'number')

export const validateGridCols = (
  cols: unknown,
  { component, count, columns }: TGridColsSpec,
): TGridColsValidationResult => {
  if (!isNumberArray(cols)) {
    return {
      valid: false,
      message: `[${component}] "cols" must be an array of ${count} numbers (${columns}). Got: ${JSON.stringify(cols)}.`,
    }
  }

  const sum = cols.reduce((acc, span) => acc + span, 0)

  if (cols.length !== count || sum !== ANTD_GRID_TOTAL) {
    return {
      valid: false,
      message: `[${component}] "cols" expects exactly ${count} grid spans summing to ${ANTD_GRID_TOTAL} (${columns}). Got [${cols.join(
        ', ',
      )}] (length ${
        cols.length
      }, sum ${sum}). The modal layout will render incorrectly — fix "cols" in the factory config.`,
    }
  }

  return { valid: true }
}
