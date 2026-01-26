import { CSSProperties } from 'react'
import { TKeyCounterProps } from './KeyCounter'
import { TItemCounterProps } from './ItemCounter'
import { TLabelsBaseProps, TLabelsModalProps } from './Labels'
import { TAnnotationsBaseProps, TAnnotationsModalProps } from './Annotations'
import { TTaintsBaseProps, TTaintsModalProps } from './Taints'
import { TTolerationsBaseProps, TTolerationsModalProps } from './Tolerations'
import { TEnrichedTableProps } from './EnrichedTable'

export type TAggregatedCounterCardProps = {
  id: number | string
  iconBase64Encoded?: string
  text: string
  counter:
    | {
        type: 'key'
        props: Omit<TKeyCounterProps, 'id' | 'text'>
      }
    | {
        type: 'item'
        props: Omit<TItemCounterProps, 'id' | 'text'>
      }
  activeType?:
    | {
        type: 'labels'
        props: TLabelsBaseProps & TLabelsModalProps
      }
    | {
        type: 'annotations'
        props: TAnnotationsBaseProps & TAnnotationsModalProps
      }
    | {
        type: 'taints'
        props: TTaintsBaseProps & TTaintsModalProps
      }
    | {
        type: 'tolerations'
        props: TTolerationsBaseProps & TTolerationsModalProps
      }
    | {
        type: 'table'
        props: {
          modalTitle?: string
          modalDescriptionText?: string
          modalDescriptionTextStyle?: CSSProperties
          editModalWidth?: number | string
        } & TEnrichedTableProps
      }
}
