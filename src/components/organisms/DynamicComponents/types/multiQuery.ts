export type TMultiQueryProps = {
  id: number | string
  text: string
  /** Which request index this molecule depends on (for per-request error isolation) */
  reqIndex?: string
}
