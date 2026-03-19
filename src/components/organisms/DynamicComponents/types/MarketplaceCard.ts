export type TMarketplaceCardProps = {
  id: number | string
  cluster: string
  namespace: string
  baseApiGroup: string
  baseApiVersion: string
  marketplacePlural: string
  marketplaceKind: string
  baseprefix?: string
  standalone?: boolean
  addedMode?: boolean
  showZeroResources?: boolean
  /** Which request index this molecule depends on (for per-request error isolation) */
  reqIndex?: string
}
