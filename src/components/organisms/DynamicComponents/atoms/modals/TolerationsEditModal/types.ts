export type TTolerationOperator = 'Exists' | 'Equal'
export type TTaintEffect = 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute'

export type TToleration = {
  key?: string
  operator?: TTolerationOperator
  value?: string
  effect?: TTaintEffect
}
