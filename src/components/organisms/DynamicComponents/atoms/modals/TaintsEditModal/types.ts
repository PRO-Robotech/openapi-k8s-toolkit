export type TTaintEffect = 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute'

export type TTaintLike = { key?: string; value?: string; effect: TTaintEffect }
