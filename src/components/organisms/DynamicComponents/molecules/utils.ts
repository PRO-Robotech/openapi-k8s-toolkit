/* eslint-disable no-plusplus */
import _ from 'lodash'
import jp from 'jsonpath'
import { prepareTemplate } from 'utils/prepareTemplate'

export const parsePartsOfUrl = ({
  template,
  replaceValues,
}: {
  template: string
  replaceValues: Record<string, string | undefined>
}): string => {
  return prepareTemplate({ template, replaceValues })
}

type TDataMap = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export const parseMutliqueryText = ({
  text,
  multiQueryData,
  customFallback,
}: {
  text?: string
  multiQueryData: TDataMap
  customFallback?: string
}): string => {
  if (!text) {
    return ''
  }

  // 1: req index
  // 2: comma-separated quoted keys
  // 3: optional quoted fallback
  // return text.replace(/\{reqs\[(\d+)\]\[((?:\s*['"][^'"]+['"]\s*,?)+)\]\}/g, (match, reqIndexStr, rawPath) => {
  return text.replace(
    /\{reqs\[(\d+)\]\[((?:\s*['"][^'"]+['"]\s*,?)+)\](?:\[\s*['"]([^'"]+)['"]\s*\])?\}/g,
    (_match, reqIndexStr, rawPath, fallback) => {
      try {
        const reqIndex = parseInt(reqIndexStr, 10)

        // Extract quoted keys into a path array using another regex
        // Matches: 'key', "another", 'deeply_nested'
        // Explanation:
        //   ['"]      - opening quote (single or double)
        //   ([^'"]+)  - capture group: any characters that are not quotes
        //   ['"]      - closing quote
        const path = Array.from(rawPath.matchAll(/['"]([^'"]+)['"]/g) as IterableIterator<RegExpMatchArray>).map(
          m => m[1],
        )

        // Use lodash.get to safely access deep value
        const value = _.get(multiQueryData[`req${reqIndex}`] || {}, path, fallback !== undefined ? fallback : undefined)
        if (value == null && !customFallback) {
          return fallback ?? 'Undefined with no fallback'
        }
        if (customFallback && (value === undefined || value === null)) {
          return customFallback
        }
        return String(value)
      } catch {
        return _match // fallback to original if anything fails
      }
    },
  )
}

export const parseJsonPathTemplate = ({
  text,
  multiQueryData,
  customFallback,
  replaceValues,
}: {
  text?: string
  multiQueryData: TDataMap
  customFallback?: string
  replaceValues?: Record<string, string | undefined>
}): string => {
  if (!text) return ''

  const placeholderRegex =
    /\{reqsJsonPath\[(\d+)\]\s*\[\s*(['"])([\s\S]*?)\2\s*\](?:\s*\[\s*(['"])([\s\S]*?)\4\s*\])?\}/g

  const resolve = (input: string): string =>
    input.replace(
      placeholderRegex,
      (match, reqIndexStr, _quote, rawJsonPathExpr, _fallbackQuote, inlineFallback = 'Undefined with no fallback') => {
        try {
          const reqIndex = Number(reqIndexStr)
          const jsonRoot = multiQueryData[`req${reqIndex}`]

          // ---- STEP 1: recursively resolve reqsJsonPath INSIDE jsonPathExpr ----
          let jsonPathExpr = rawJsonPathExpr
          let previous: string | null = null
          let loopGuard = 0

          while (previous !== jsonPathExpr && loopGuard < 10) {
            previous = jsonPathExpr
            jsonPathExpr = resolve(jsonPathExpr) // recursion on inner {reqsJsonPath...}
            loopGuard++
          }

          // ---- STEP 2: apply prepareTemplate-style replacements INSIDE jsonPathExpr ----
          if (replaceValues) {
            jsonPathExpr = prepareTemplate({
              template: jsonPathExpr,
              replaceValues,
            })
          }

          // ---- STEP 3: evaluate final JSONPath ----
          if (jsonRoot === undefined && customFallback) return customFallback
          if (jsonRoot === undefined) return inlineFallback

          const results = jp.query(jsonRoot, `$${jsonPathExpr}`)
          const value = results?.[0]

          if (value == null) {
            return customFallback ?? inlineFallback
          }

          return String(value)
        } catch {
          return match
        }
      },
    )

  // ---- outer multi-pass resolution ----
  let result = text
  let previous: string | null = null
  let iterations = 0

  while (result !== previous && iterations < 10) {
    previous = result
    result = resolve(result)
    iterations++
  }

  return result
}

export const parseWithoutPartsOfUrl = ({
  text,
  multiQueryData,
  customFallback,
}: {
  text: string
  multiQueryData: TDataMap
  customFallback?: string
}): string => {
  return parseJsonPathTemplate({
    text: parseMutliqueryText({
      text,
      multiQueryData,
      customFallback,
    }),
    multiQueryData,
    customFallback,
  })
}

export const parseAll = ({
  text,
  replaceValues,
  multiQueryData,
}: {
  text: string
  replaceValues: Record<string, string | undefined>
  multiQueryData: TDataMap
}): string => {
  return parsePartsOfUrl({
    template: parseJsonPathTemplate({
      text: parseMutliqueryText({
        text,
        multiQueryData,
      }),
      multiQueryData,
      replaceValues,
    }),
    replaceValues,
  })
}
