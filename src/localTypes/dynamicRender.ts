import { ReactElement } from 'react'
import { TUseK8sSmartResourceParams } from 'hooks/useK8sSmartResource'
// A map where keys are item types and values are the data shape for each
/*
  type MyItemTypeMap = {
    text: { content: string }
    image: { src: string; alt: string }
  }
*/
export type TItemTypeMap = Record<string, unknown>

// An individual renderable item
/*
  type MyRenderableItem =
    | { type: "text"; data: { content: string } }
    | { type: "image"; data: { src: string; alt: string } }
*/
export type TRenderableItem<T extends TItemTypeMap> = {
  [K in keyof T]: {
    type: K
    data: T[K]
    children?: readonly TRenderableItem<T>[] // Add optional children
  }
}[keyof T]

// Component mapping
/*
  const renderers: TRendererComponents<MyItemTypeMap> = {
    text: ({ data }) => <p>{data.content}</p>,
    image: ({ data }) => <img src={data.src} alt={data.alt} />
  }
*/
export type TRendererComponents<T extends TItemTypeMap> = {
  [K in keyof T]: React.ComponentType<{
    data: T[K]
    children?: ReactElement | ReactElement[]
  }>
}

export type TFactoryDataK8s<T extends TItemTypeMap> = {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  urlsToFetch: string | TUseK8sSmartResourceParams<any>
  withScrollableMainContentCard?: boolean
  data: TRenderableItem<T>[]
  sidebarTags?: string[]
}

export type TFactoryResource<T extends TItemTypeMap> = {
  apiVersion: string
  kind: string
  spec: TFactoryDataK8s<T>
} & unknown

export type TFactoryResponse<T extends TItemTypeMap> = {
  apiVersion: string
  items: TFactoryResource<T>[]
}
