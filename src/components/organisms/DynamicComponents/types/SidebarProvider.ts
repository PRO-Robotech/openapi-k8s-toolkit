import type { TManageableSidebarProviderProps } from 'components/molecules'

export type TSidebarProviderProps = { id: number | string } & Omit<TManageableSidebarProviderProps, 'replaceValues'>
