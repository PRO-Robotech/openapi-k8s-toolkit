/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MutableRefObject } from 'react'
import _ from 'lodash'
import { OpenAPIV2 } from 'openapi-types'
import { TFormName } from 'localTypes/form'

export const pathKey = (p: (string | number)[]) => JSON.stringify(p)

/**
 * Recursively prunes schema properties that are marked as "additional"
 * but are not present in the given values object, or are in blocked paths.
 *
 * @param props - The OpenAPI v2 schema `properties` definition to prune.
 * @param values - The actual data values that correspond to the schema.
 * @returns A new pruned copy of the schema `properties`.
 */
export const pruneAdditionalForValues = (
  props: OpenAPIV2.SchemaObject['properties'],
  values: Record<string, unknown>,
  blockedPathsRef: MutableRefObject<Set<string>>,
): OpenAPIV2.SchemaObject['properties'] => {
  // Deep clone the schema properties to avoid mutating the original object
  const next = _.cloneDeep(props) || {}

  /**
   * Recursively traverses the schema and its corresponding value node.
   * Deletes additional properties not present in `values`, or that are blocked.
   *
   * @param schemaNode - The current node in the schema being traversed.
   * @param valueNode - The corresponding node in the values object.
   * @param path - The current traversal path (used for blocked path detection).
   */
  const walk = (schemaNode: any, valueNode: any, path: (string | number)[] = []) => {
    if (!schemaNode) return

    // If the current schema node is an object, process its properties
    if (schemaNode.type === 'object') {
      // Ensure valueNode is a plain object (ignore arrays or primitives)
      const vo = valueNode && typeof valueNode === 'object' && !Array.isArray(valueNode) ? valueNode : {}
      if (schemaNode.properties) {
        Object.keys(schemaNode.properties).forEach(k => {
          const child = schemaNode.properties[k] as any
          const currentPath = pathKey([...path, k])

          // If the property is "additional" and should be removed:
          // - It's not in the value object, or
          // - It's explicitly blocked (tracked in blockedPathsRef)
          if (child?.isAdditionalProperties && (!(k in vo) || blockedPathsRef.current.has(currentPath))) {
            delete schemaNode.properties[k]
            return
          }

          // Recursively continue down into child nodes
          walk(child as OpenAPIV2.SchemaObject, vo?.[k], [...path, k])
        })
      }
    }

    // If the schema node is an array, recurse into each item
    if (schemaNode.type === 'array' && schemaNode.items && Array.isArray(valueNode)) {
      valueNode.forEach((item, idx) => {
        // If array items have specific indexed schema properties, walk into them
        if ((schemaNode as any).properties?.[idx]) {
          walk(schemaNode.items as OpenAPIV2.SchemaObject, item, [...path, idx])
        }
      })
    }
  }

  // Start traversal at each top-level property in the cloned schema
  Object.keys(next || {}).forEach(top => {
    walk(next[top] as OpenAPIV2.SchemaObject, (values as any)?.[top], [top])
  })

  // Return the pruned schema
  return next
}

/**
 * Dynamically materializes (adds) new schema properties from the `values` object
 * whenever those properties correspond to `additionalProperties` in an OpenAPI schema.
 *
 * Essentially, this function:
 * - Detects new fields in `values` that aren’t in `props`, but are allowed by `additionalProperties`.
 * - Expands the schema to include them (so the form/UI can render them).
 * - Tracks which fields should be persisted or expanded further.
 *
 * Summary of what this function does
 * Clones the input schema to prevent side effects.
 * Walks recursively through schema objects and arrays.
 * Removes any schema nodes marked as isAdditionalProperties that are:
 * -- Missing from the corresponding values object, or
 * -- Listed in blockedPathsRef.current.
 * Returns a pruned version of the schema matching only relevant properties.
 *
 * @param props - The base OpenAPI v2 schema `properties` to augment.
 * @param values - The runtime data values to derive new schema fields from.
 * @param blockedPathsRef - A ref set of schema paths that should not be modified.
 * @returns An object containing:
 *   - `props`: the updated schema with materialized additional properties
 *   - `toExpand`: list of field paths that should be expanded (e.g., in a UI)
 *   - `toPersist`: list of field paths that should be persisted (saved)
 */
export const materializeAdditionalFromValues = (
  props: OpenAPIV2.SchemaObject['properties'],
  values: Record<string, unknown>,
  blockedPathsRef: MutableRefObject<Set<string>>,
): { props: OpenAPIV2.SchemaObject['properties']; toExpand: TFormName[]; toPersist: TFormName[] } => {
  // Create a deep copy of the schema to avoid mutating the original definition
  const next = _.cloneDeep(props) || {}

  // Lists of paths for further actions after expansion
  const toExpand: TFormName[] = []
  const toPersist: TFormName[] = []

  /**
   * Helper function to construct a new child schema node
   * derived from the schema's `additionalProperties` definition.
   *
   * This is used when a new field appears in the data but doesn't yet exist in the schema.
   */
  const makeChildFromAP = (ap: any, value?: unknown): OpenAPIV2.SchemaObject => {
    // Determine type based on actual value if not explicitly defined in additionalProperties
    let t = ap?.type
    if (!t && value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        t = 'array'
      } else if (typeof value === 'object') {
        t = 'object'
      } else if (typeof value === 'string') {
        t = 'string'
      } else if (typeof value === 'number') {
        t = 'number'
      } else if (typeof value === 'boolean') {
        t = 'boolean'
      } else {
        t = 'object'
      }
    }
    t = t ?? 'object'
    
    const child: OpenAPIV2.SchemaObject = { type: t } as any

    // Copy common schema details (if present)
    if (ap?.properties) (child as any).properties = _.cloneDeep(ap.properties)
    if (ap?.items) (child as any).items = _.cloneDeep(ap.items)
    if (ap?.required)
      (child as any).required = _.cloneDeep(ap.required)

    // If value is an array and items type is not defined, infer it from the first item
    if (t === 'array' && Array.isArray(value) && value.length > 0 && !ap?.items) {
      const firstItem = value[0]
      if (typeof firstItem === 'string') {
        ;(child as any).items = { type: 'string' }
      } else if (typeof firstItem === 'number') {
        ;(child as any).items = { type: 'number' }
      } else if (typeof firstItem === 'boolean') {
        ;(child as any).items = { type: 'boolean' }
      } else if (typeof firstItem === 'object') {
        ;(child as any).items = { type: 'object' }
      }
    }

      // Mark as originating from `additionalProperties`
    ;(child as any).isAdditionalProperties = true
    return child
  }

  /**
   * Recursively traverses the schema and corresponding values.
   * Expands `additionalProperties` nodes when matching data values exist.
   *
   * Summary of the function’s behavior
   * Goal: Dynamically inject new fields into a schema based on the current data (values) when those fields are permitted by additionalProperties.
   * Expands schema objects and arrays recursively.
   * Skips blocked paths to avoid unintended mutation.
   * Tracks:
   * -- toExpand: fields the UI should reveal or re-render.
   * -- toPersist: fields that must be saved because they’re new or empty placeholders.
   *
   * @param schemaNode - Current schema node being traversed
   * @param valueNode - Corresponding value node in the data
   * @param path - Array of keys/indexes representing the traversal path
   */
  const walk = (schemaNode: OpenAPIV2.SchemaObject | undefined, valueNode: unknown, path: (string | number)[]) => {
    if (!schemaNode) return

    // --- Handle OBJECT nodes ---
    if (schemaNode.type === 'object') {
      const ap = schemaNode.additionalProperties as any

      // Only process if the node allows additional properties and the value is an object
      if (ap && valueNode && typeof valueNode === 'object' && !Array.isArray(valueNode)) {
        const vo = valueNode as Record<string, unknown>
        schemaNode.properties = schemaNode.properties || {}

        // Mark this path for expansion (UI/rendering)
        toExpand.push([...path])

        // Iterate over the actual keys in the value object
        Object.keys(vo).forEach(k => {
          const current = pathKey([...path, k])
          if (blockedPathsRef.current.has(current)) return

          // If the key doesn't exist in schema, create it from `additionalProperties`
          if (!schemaNode.properties![k]) {
            // Check if there's a nested property definition in additionalProperties
            const nestedProp = ap?.properties?.[k]
            if (nestedProp) {
              // Use the nested property definition from additionalProperties
              schemaNode.properties![k] = _.cloneDeep(nestedProp) as any
              ;(schemaNode.properties![k] as any).isAdditionalProperties = true
            } else {
              // Create from additionalProperties with value-based type inference
              schemaNode.properties![k] = makeChildFromAP(ap, vo[k])
            }
            // If it's an existing additional property, merge any nested structure
          } else if ((schemaNode.properties![k] as any).isAdditionalProperties && ap?.properties) {
            ;(schemaNode.properties![k] as any).properties ??= _.cloneDeep(ap.properties)
          }

          // Mark this path for expansion (UI/rendering)
          toExpand.push([...path, k])

          // Determine whether the new field should be persisted
          const v = vo[k]

          // Persist empty objects — these might represent placeholders for future data
          if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) {
            toPersist.push([...path, k])
          }
          // Persist primitive empty values or empty arrays
          else if (v === '' || v === 0 || (Array.isArray(v) && v.length === 0)) {
            toPersist.push([...path, k])
          }
        })
      }

      // Recursively traverse existing schema properties
      if (schemaNode.properties && valueNode && typeof valueNode === 'object' && !Array.isArray(valueNode)) {
        const vo = valueNode as Record<string, unknown>
        Object.keys(schemaNode.properties).forEach(k => {
          walk(schemaNode.properties![k] as OpenAPIV2.SchemaObject, vo?.[k], [...path, k])
        })
      }
    }

    // --- Handle ARRAY nodes ---
    if (schemaNode.type === 'array' && schemaNode.items) {
      const arr = Array.isArray(valueNode) ? (valueNode as unknown[]) : []

      // Mark arrays with content for expansion
      if (arr.length) toExpand.push([...path])

      arr.forEach((itemVal, idx) => {
        // Ensure array properties are properly initialized
        if ((schemaNode as any).properties) {
          ;(schemaNode as any).properties[idx as any] = (schemaNode as any).properties[idx as any] || {
            properties: {},
          }
        }
        // Recursively walk each array item
        walk(schemaNode.items as OpenAPIV2.SchemaObject, itemVal, [...path, idx])
      })
    }
  }

  // Start traversal from top-level schema properties
  Object.keys(next || {}).forEach(top => {
    walk(next[top] as OpenAPIV2.SchemaObject, (values as any)?.[top], [top])
  })

  // Return updated schema and tracking info
  return { props: next, toExpand, toPersist }
}
