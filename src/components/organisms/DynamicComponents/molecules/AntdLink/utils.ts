export const isExternalHref = (href: string): boolean => {
  if (!href) {
    return false
  }

  if (/^(mailto:|tel:|sms:)/i.test(href)) {
    return true
  }

  if (href.startsWith('//')) {
    return true
  }

  try {
    const parsed = new URL(href, window.location.origin)
    return parsed.origin !== window.location.origin
  } catch {
    return false
  }
}
