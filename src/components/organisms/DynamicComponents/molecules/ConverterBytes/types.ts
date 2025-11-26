export type TCanonicalUnit =
  | 'B'
  | 'kB'
  | 'MB'
  | 'GB'
  | 'TB'
  | 'PB'
  | 'EB'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'TiB'
  | 'PiB'
  | 'EiB'

export type TUnitInput =
  | TCanonicalUnit
  // SI aliases (single letters)
  | 'b'
  | 'byte'
  | 'bytes'
  | 'k'
  | 'm'
  | 'g'
  | 't'
  | 'p'
  | 'e'
  // SI upper-case shortcuts
  | 'K'
  | 'M'
  | 'G'
  | 'T'
  | 'P'
  | 'E'
  // SI two-letter variants (upper & lower)
  | 'kb'
  | 'KB'
  | 'mb'
  | 'Mb'
  | 'MB'
  | 'gb'
  | 'Gb'
  | 'GB'
  | 'tb'
  | 'Tb'
  | 'TB'
  | 'pb'
  | 'Pb'
  | 'PB'
  | 'eb'
  | 'Eb'
  | 'EB'
  // IEC aliases
  | 'ki'
  | 'mi'
  | 'gi'
  | 'ti'
  | 'pi'
  | 'ei'
  | 'kib'
  | 'mib'
  | 'gib'
  | 'tib'
  | 'pib'
  | 'eib'
  // IEC canonical/upper variants
  | 'Ki'
  | 'Mi'
  | 'Gi'
  | 'Ti'
  | 'Pi'
  | 'Ei'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'TiB'
  | 'PiB'
  | 'EiB'

export type TConvertOptions = {
  /** If true, returns "12.3 GiB" instead of just 12.3 */
  format?: boolean
  /** Max fraction digits when formatting (default 2) */
  precision?: number
  /** Locale for number formatting (default: undefined => user agent) */
  locale?: string
}
