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
  /** Which request index this molecule depends on (for per-request error isolation) */
  reqIndex?: string
}
