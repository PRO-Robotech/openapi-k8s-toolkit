type TBasePromQueryProps = {
  baseUrl?: string
  query?: string
  refetchInterval?: number | false
}

type TBaseRangeProps = {
  range?: string
}

type TBaseTitleProps = {
  title?: string
}

export type TMatrixToTableRowsProps = TBasePromQueryProps & TBaseRangeProps & TBaseTitleProps

export type TMatrixToReducedBarProps = TBasePromQueryProps &
  TBaseRangeProps & {
    mode?: 'last' | 'avg' | 'sum' | 'max' | 'min'
  }

export type TMatrixToLineSingleProps = TBasePromQueryProps & TBaseRangeProps

export type TMatrixToLineMultiProps = TBasePromQueryProps & TBaseRangeProps

export type TMatrixToAreaStackedProps = TBasePromQueryProps & TBaseRangeProps

export type TMatrixToAreaSingleProps = TBasePromQueryProps & TBaseRangeProps

export type TMatrixToAreaMultiProps = TBasePromQueryProps & TBaseRangeProps

export type TVectorToTableRowsProps = TBasePromQueryProps & TBaseTitleProps

export type TVectorToPieProps = TBasePromQueryProps

export type TVectorToGaugeRadialProps = TBasePromQueryProps &
  TBaseTitleProps & {
    min?: number
    max?: number
  }

export type TVectorToBarVerticalProps = TBasePromQueryProps

export type TVectorToBarHorizontalProps = TBasePromQueryProps

export type TVectorToBarGaugeProps = TBasePromQueryProps &
  TBaseTitleProps & {
    topN?: number
  }

export type TScalarToGaugeProps = TBasePromQueryProps &
  TBaseTitleProps & {
    min?: number
    max?: number
    /** optional label formatter under the bar */
    formatValue?: (v: number) => string
  }

export type TScalarToStatProps = TBasePromQueryProps &
  TBaseTitleProps & {
    title?: string
    /** optional formatter for value */
    formatValue?: (v: number) => string | number
  }
