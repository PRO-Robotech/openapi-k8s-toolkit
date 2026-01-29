import {
  TAntdTextProps,
  TAntdLinkProps,
  TAntdCardProps,
  TAntdFlexProps,
  TAntdRowProps,
  TAntdColProps,
  TAntdTabsProps,
  TAntdButtonProps,
  TAntdIconsProps,
} from './antdComponents'
import { TDefaultDivProps } from './DefaultDiv'
import { TPartsOfUrlProps } from './partsOfUrl'
import { TMultiQueryProps } from './multiQuery'
import { TParsedTextProps } from './parsedText'
import { TProjectInfoCardProps } from './ProjectInfoCard'
import { TMarketplaceCardProps } from './MarketplaceCard'
import { TContentCardProps } from './ContentCard'
import { TSpacerProps } from './Spacer'
import { TStatusTextProps } from './StatusText'
import { TSidebarProviderProps } from './SidebarProvider'
import { TEnrichedTableProps } from './EnrichedTable'
import { TPodTerminalProps, TNodeTerminalProps, TPodLogsProps } from './Terminals'
import { TYamlEditorSingletonProps } from './YamlEditorSingleton'
import { TVisibilityContainerProps } from './VisibilityContainer'
import { TArrayOfObjectsToKeyValuesProps } from './ArrayOfObjectsToKeyValues'
import { TItemCounterProps } from './ItemCounter'
import { TKeyCounterProps } from './KeyCounter'
import { TLabelsProps } from './Labels'
import { TLabelsToSearchParamsProps } from './LabelsToSearchParams'
import { TTaintsProps } from './Taints'
import { TTolerationsProps } from './Tolerations'
import { TAnnotationsProps } from './Annotations'
import { TConverterBytesProps } from './ConverterBytes'
import { TConverterCoresProps } from './ConverterCores'
import { TSecretBase64PlainProps } from './SecretBase64Plain'
import { TResourceBadgeProps } from './ResourceBadge'
import { TEventsProps } from './Events'
import { TOwnerRefsProps } from './OwnerRefs'
import { TTogglerProps } from './Toggler'
import { TTogglerSegmentedProps } from './TogglerSegmented'
import { TVMVNCProps } from './VMVNC'
import { TPrometheusGraphProps } from './PrometheusGraph'
import { TDefaultIframeProps } from './DefaultIframe'
import { TDropdownRedirectProps } from './DropdownRedirect'
import { TCopyButtonProps } from './CopyButton'
import { TAggregatedCounterCardProps } from './AggregatedCounterCard'
import { TBase64IconProps } from './Base64Icon'
import { TActionsDropdownProps } from './Actions'

export type {
  TActionUnion,
  TActionBaseProps,
  TEditActionProps,
  TEditLabelsActionProps,
  TEditAnnotationsActionProps,
  TEditTaintsActionProps,
  TEditTolerationsActionProps,
  TActionsDropdownProps,
} from './Actions'

export type TDynamicComponentsAppTypeMap = {
  antdText: TAntdTextProps
  antdLink: TAntdLinkProps
  antdCard: TAntdCardProps
  antdFlex: TAntdFlexProps
  antdRow: TAntdRowProps
  antdCol: TAntdColProps
  antdTabs: TAntdTabsProps
  antdButton: TAntdButtonProps
  antdIcons: TAntdIconsProps
  DefaultDiv: TDefaultDivProps
  partsOfUrl: TPartsOfUrlProps
  multiQuery: TMultiQueryProps
  parsedText: TParsedTextProps
  ProjectInfoCard: TProjectInfoCardProps
  MarketplaceCard: TMarketplaceCardProps
  ContentCard: TContentCardProps
  Spacer: TSpacerProps
  StatusText: TStatusTextProps
  SidebarProvider: TSidebarProviderProps
  EnrichedTable: TEnrichedTableProps
  PodTerminal: TPodTerminalProps
  NodeTerminal: TNodeTerminalProps
  PodLogs: TPodLogsProps
  YamlEditorSingleton: TYamlEditorSingletonProps
  VisibilityContainer: TVisibilityContainerProps
  ArrayOfObjectsToKeyValues: TArrayOfObjectsToKeyValuesProps
  ItemCounter: TItemCounterProps
  KeyCounter: TKeyCounterProps
  Labels: TLabelsProps
  LabelsToSearchParams: TLabelsToSearchParamsProps
  Taints: TTaintsProps
  Tolerations: TTolerationsProps
  Annotations: TAnnotationsProps
  ConverterBytes: TConverterBytesProps
  ConverterCores: TConverterCoresProps
  SecretBase64Plain: TSecretBase64PlainProps
  ResourceBadge: TResourceBadgeProps
  Events: TEventsProps
  OwnerRefs: TOwnerRefsProps
  Toggler: TTogglerProps
  TogglerSegmented: TTogglerSegmentedProps
  VMVNC: TVMVNCProps
  PrometheusGraph: TPrometheusGraphProps
  DefaultIframe: TDefaultIframeProps
  DropdownRedirect: TDropdownRedirectProps
  CopyButton: TCopyButtonProps
  AggregatedCounterCard: TAggregatedCounterCardProps
  Base64Icon: TBase64IconProps
  ActionsDropdown: TActionsDropdownProps
}
