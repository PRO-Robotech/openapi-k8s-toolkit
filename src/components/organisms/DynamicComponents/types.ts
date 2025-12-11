import { CSSProperties } from 'react'
import { CardProps, FlexProps, RowProps, ColProps, ButtonProps, TabsProps, SelectProps } from 'antd'
import type { TextProps } from 'antd/es/typography/Text'
import type { LinkProps } from 'antd/es/typography/Link'
import type { TContentCardProps, TSpacerProps } from 'components/atoms'
import type { TManageableSidebarProviderProps, TEnrichedTableProviderProps } from 'components/molecules'
import type { TUnitInput } from 'localTypes/factories/converterBytes'
import type { TCoreUnitInput } from 'localTypes/factories/converterCores'

export type TDynamicComponentsAppTypeMap = {
  DefaultDiv: { id: number | string } & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
  antdText: { id: number | string; text: string } & Omit<TextProps, 'id' | 'children'>
  antdLink: {
    id: number | string
    text: string
    href: string
  } & Omit<LinkProps, 'id' | 'children' | 'href'>
  antdCard: { id: number | string } & Omit<CardProps, 'id'>
  antdFlex: { id: number | string } & Omit<FlexProps, 'id' | 'children'>
  antdRow: { id: number | string } & Omit<RowProps, 'id' | 'children'>
  antdCol: { id: number | string } & Omit<ColProps, 'id' | 'children'>
  antdTabs: { id: number | string } & Omit<TabsProps, 'id' | 'children'>
  antdButton: { id: number | string; text: string } & Omit<ButtonProps, 'id' | 'children'>
  partsOfUrl: { id: number | string; text: string }
  multiQuery: { id: number | string; text: string }
  parsedText: { id: number | string; text: string; formatter?: 'timestamp'; style?: CSSProperties }
  ProjectInfoCard: {
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
  MarketplaceCard: {
    id: number | string
    cluster: string
    namespace: string
    baseApiGroup: string
    baseApiVersion: string
    marketplacePlural: string
    marketplaceKind: string
    baseprefix?: string
    standalone?: boolean
    forceAddedMode?: boolean
    showZeroResources?: boolean
  }
  ContentCard: { id: number | string } & TContentCardProps
  Spacer: { id: number | string } & TSpacerProps
  StatusText: {
    id: number | string
    values: string[] // array of reqsJsonPath
    criteriaSuccess: 'equals' | 'notEquals'
    criteriaError: 'equals' | 'notEquals'
    stategySuccess?: 'some' | 'every' // every - default
    strategyError?: 'some' | 'every' // every - default
    valueToCompareSuccess: unknown[]
    valueToCompareError: unknown[]
    successText: string
    errorText: string
    fallbackText: string
  } & Omit<TextProps, 'id' | 'children'>
  SidebarProvider: { id: number | string } & Omit<TManageableSidebarProviderProps, 'replaceValues'>
  EnrichedTable: {
    id: number | string
    fetchUrl?: string
    k8sResourceToFetch?: {
      apiGroup?: string
      apiVersion: string
      plural: string
      namespace?: string
    }
    pathToItems: string | string[] // jsonpath or keys as string[]
    additionalReqsDataToEachItem?: number[]
    cluster: string
    labelSelector?: Record<string, string>
    labelSelectorFull?: {
      reqIndex: number
      pathToLabels: string | string[] // jsonpath or keys as string[]
    }
    fieldSelector?: Record<string, string>
  } & Omit<
    TEnrichedTableProviderProps,
    | 'tableMappingsReplaceValues'
    | 'withoutControls'
    | 'cluster'
    | 'theme'
    | 'tableProps'
    | 'dataItems'
    | 'dataForControlsInternal'
  >
  PodTerminal: {
    id: number | string
    cluster: string
    namespace: string
    podName: string
    substractHeight?: number
  }
  NodeTerminal: {
    id: number | string
    cluster: string
    nodeName: string
    substractHeight?: number
  }
  PodLogs: {
    id: number | string
    cluster: string
    namespace: string
    podName: string
    substractHeight?: number
  }
  YamlEditorSingleton: {
    id: number | string
    cluster: string
    isNameSpaced: boolean
    type: 'builtin' | 'apis'
    apiGroup?: string
    apiVersion?: string
    plural: string
    forcedKind?: string
    prefillValuesRequestIndex: number
    pathToData?: string | string[] // jsonpath or keys as string[]
    substractHeight?: number
    readOnly?: boolean
  }
  VisibilityContainer: {
    id: number | string
    value: string
    criteria?: 'equals' | 'notEquals'
    valueToCompare?: string | string[]
  }
  ArrayOfObjectsToKeyValues: {
    id: number | string
    reqIndex: string
    jsonPathToArray: string
    keyFieldName: string
    valueFieldName: string
    separator?: string
    containerStyle?: CSSProperties
    rowStyle?: CSSProperties
    keyFieldStyle?: CSSProperties
    valueFieldStyle?: CSSProperties
  }
  ItemCounter: {
    id: number | string
    reqIndex: string
    jsonPathToArray: string
    text: string
    errorText: string
    style?: CSSProperties
  }
  KeyCounter: {
    id: number | string
    reqIndex: string
    jsonPathToObj: string
    text: string
    errorText: string
    style?: CSSProperties
  }
  Labels: {
    id: number | string
    reqIndex: string
    jsonPathToLabels: string
    linkPrefix?: string
    selectProps?: SelectProps
    maxTagKeyLength?: number
    maxTagValueLength?: number
    verticalViewList?: boolean
    verticalViewListFlexProps?: FlexProps
    emptyListMessage?: string
    emptyListMessageStyle?: CSSProperties
    readOnly?: true
    notificationSuccessMessage?: string
    notificationSuccessMessageDescription?: string
    modalTitle?: string
    modalDescriptionText?: string
    modalDescriptionTextStyle?: CSSProperties
    inputLabel?: string
    inputLabelStyle?: CSSProperties
    containerStyle?: CSSProperties
    maxEditTagTextLength?: number
    allowClearEditSelect?: boolean
    endpoint?: string
    pathToValue?: string
    editModalWidth?: number | string
    paddingContainerEnd?: string
  }
  LabelsToSearchParams: {
    id: number | string
    reqIndex: string
    jsonPathToLabels: string
    linkPrefix: string
    textLink?: string
    errorText: string
    maxTextLength?: number
  } & Omit<LinkProps, 'id' | 'children' | 'href'>
  Taints: {
    id: number | string
    reqIndex: string
    jsonPathToArray: string
    text: string
    errorText: string
    style?: CSSProperties
    notificationSuccessMessage?: string
    notificationSuccessMessageDescription?: string
    modalTitle?: string
    modalDescriptionText?: string
    modalDescriptionTextStyle?: CSSProperties
    inputLabel?: string
    inputLabelStyle?: CSSProperties
    containerStyle?: CSSProperties
    endpoint?: string
    pathToValue?: string
    editModalWidth?: number | string
    cols: number[] // 4
  }
  Tolerations: {
    id: number | string
    reqIndex: string
    jsonPathToArray: string
    text: string
    errorText: string
    containerStyle?: CSSProperties
    notificationSuccessMessage?: string
    notificationSuccessMessageDescription?: string
    modalTitle?: string
    modalDescriptionText?: string
    modalDescriptionTextStyle?: CSSProperties
    inputLabel?: string
    inputLabelStyle?: CSSProperties
    endpoint?: string
    pathToValue?: string
    editModalWidth?: number | string
    cols: number[] // 5
  }
  Annotations: {
    id: number | string
    reqIndex: string
    jsonPathToObj: string
    text: string
    errorText: string
    containerStyle?: CSSProperties
    notificationSuccessMessage?: string
    notificationSuccessMessageDescription?: string
    modalTitle?: string
    modalDescriptionText?: string
    modalDescriptionTextStyle?: CSSProperties
    inputLabel?: string
    inputLabelStyle?: CSSProperties
    endpoint?: string
    pathToValue?: string
    editModalWidth?: number | string
    cols: number[] // 3
  }
  ConverterBytes: {
    id: number | string
    bytesValue: string | string[] // reqs
    unit?: TUnitInput // do not enter if wanna auto format
    /** If true, returns "12.3 GiB" instead of just 12.3 */
    format?: boolean
    /** Max fraction digits when formatting (default 2) */
    precision?: number
    /** Locale for number formatting (default: undefined => user agent) */
    locale?: string
    standard?: 'si' | 'iec'
    notANumberText?: string
    style?: CSSProperties
    /** If provided, value is in this unit instead of raw bytes */
    fromUnit?: TUnitInput
    /** If provided, convert to this explicit unit */
    toUnit?: TUnitInput // do not enter if wanna auto format
    /** If omitted and toUnit is missing, use auto-scaling */
  }
  ConverterCores: {
    id: number | string
    /** Raw text that may contain a number or number+unit like "0.5", "500m", "2 vcpu" */
    coresValue: string | string[]
    /** Target unit; omit to auto format (core vs mcore) */
    unit?: TCoreUnitInput
    /** If true, returns "500 mcore" instead of just 500 */
    format?: boolean
    /** Max fraction digits when formatting (default 2) */
    precision?: number
    /** Locale for number formatting (default: undefined => user agent) */
    locale?: string
    notANumberText?: string
    style?: CSSProperties
    /** If provided, value is in this unit instead of raw "cores" */
    fromUnit?: TCoreUnitInput
    /** If provided, convert to this explicit unit; omit for auto-format */
    toUnit?: TCoreUnitInput
    /** If omitted and toUnit is missing, use auto-scaling (core vs mcore) */
  }
  SecretBase64Plain: {
    id: number | string
    base64Value?: string // reqs | one of required
    plainTextValue?: string // reqs | one of required
    containerStyle?: CSSProperties
    inputContainerStyle?: CSSProperties
    flexProps?: Omit<FlexProps, 'children'>
    niceLooking?: boolean
    notificationWidth?: string // default 300px
    notificationText?: string // Text copied to clipboard
  }
  ResourceBadge: {
    id: number | string
    value: string // to get color and maybe abbr
    abbreviation?: string
    style?: CSSProperties
  }
  Events: {
    id: number | string
    baseprefix?: string
    cluster: string
    wsUrl: string
    pageSize?: number
    substractHeight?: number
    limit?: number
    labelSelector?: Record<string, string>
    labelSelectorFull?: {
      reqIndex: number
      pathToLabels: string | string[] // jsonpath or keys as string[]
    }
    fieldSelector?: Record<string, string>
    baseFactoryNamespacedAPIKey: string
    baseFactoryClusterSceopedAPIKey: string
    baseFactoryNamespacedBuiltinKey: string
    baseFactoryClusterSceopedBuiltinKey: string
    baseNamespaceFactoryKey: string
    baseNavigationPlural: string
    baseNavigationName: string
  }
  OwnerRefs: {
    id: number | string
    baseprefix?: string
    cluster: string
    reqIndex: string // full object for forced labels
    errorText: string
    notArrayErrorText: string
    emptyArrayErrorText: string
    isNotRefsArrayErrorText: string
    containerStyle?: CSSProperties
    listFlexProps?: FlexProps
    jsonPathToArrayOfRefs: string
    forcedApiVersion?: {
      kind: string
      apiVersion: string
    }[]
    forcedNamespace?: string
    keysToForcedLabel?: string | string[] // jsonpath or keys as string[]
    forcedRelatedValuePath?: string
    baseFactoryNamespacedAPIKey: string
    baseFactoryClusterSceopedAPIKey: string
    baseFactoryNamespacedBuiltinKey: string
    baseFactoryClusterSceopedBuiltinKey: string
    baseNavigationPlural: string
    baseNavigationName: string
  }
  Toggler: {
    id: number | string
    reqIndex: string
    jsonPathToValue: string
    criteria: {
      type: 'forSuccess' | 'forError'
      operator: 'exists' | 'equals'
      valueToCompare?: string
    }
    notificationSuccessMessage?: string
    notificationErrorMessage?: string
    notificationSuccessMessageDescription?: string
    notificationErrorMessageDescription?: string
    containerStyle?: CSSProperties
    endpoint: string
    pathToValue: string
    valueToSubmit: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onValue: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      offValue?: any
      toRemoveWhenOff?: boolean
    }
  }
  TogglerSegmented: {
    id: number | string
    reqIndex: string
    jsonPathToValue: string
    notificationSuccessMessage?: string
    notificationErrorMessage?: string
    notificationSuccessMessageDescription?: string
    notificationErrorMessageDescription?: string
    containerStyle?: CSSProperties
    endpoint: string
    pathToValue: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    possibleValues: any[]
    valuesMap?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: any
      renderedValue: string | number
    }[]
  }
}
