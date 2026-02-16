import React from 'react'
import { isExternalHref } from '../AntdLink/utils'

export const handleLabelsToSearchParamsLinkClick = ({
  e,
  hrefPrepared,
  navigate,
}: {
  e: React.MouseEvent<HTMLElement>
  hrefPrepared: string
  navigate: (to: string) => void
}) => {
  const isExternal = isExternalHref(hrefPrepared)

  if (isExternal) {
    return
  }

  e.preventDefault()
  navigate(hrefPrepared)
}
