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
}
