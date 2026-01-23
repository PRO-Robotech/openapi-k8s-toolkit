export type TVisibilityContainerProps = {
  id: number | string
  value: string
  criteria?: 'equals' | 'notEquals' | 'exists' | 'notExists'
  valueToCompare?: string | string[]
}
