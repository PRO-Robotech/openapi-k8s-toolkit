export type TDefaultIframeProps = {
  id: number | string
  /** Which request index this molecule depends on (for per-request error isolation) */
  reqIndex?: string
} & React.DetailedHTMLProps<
  React.IframeHTMLAttributes<HTMLIFrameElement>,
  HTMLIFrameElement
>
