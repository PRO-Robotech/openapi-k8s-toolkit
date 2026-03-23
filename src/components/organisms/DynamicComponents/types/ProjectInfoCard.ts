export type TProjectInfoCardProps = {
  id: number | string
  cluster: string
  namespace: string
  baseApiGroup: string
  baseApiVersion: string
  baseProjectApiGroup: string
  baseProjectVersion: string
  projectPlural: string
  marketplacePlural: string
  accessGroups: string[]
  baseprefix?: string
  showZeroResources?: boolean
}
