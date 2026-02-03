/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableProps } from 'antd'
import jp from 'jsonpath'
import { TJSON } from 'localTypes/JSON'
import { TAdditionalPrinterColumns } from 'localTypes/richTable'

export const prepare = ({
  dataItems,
  pathToKey,
  resourceSchema,
  dataForControls,
  additionalPrinterColumns,
}: {
  dataItems: TJSON[]
  pathToKey?: string
  resourceSchema?: TJSON
  dataForControls?: {
    cluster: string
    syntheticProject?: string
    pathPrefix: string
    apiVersion: string
    plural: string
    backlink: string
    deletePathPrefix: string
    onDeleteHandle: (name: string, endpoint: string) => void
    permissions: {
      canUpdate?: boolean
      canDelete?: boolean
    }
  }
  additionalPrinterColumns?: TAdditionalPrinterColumns
}): {
  dataSource: TableProps['dataSource']
  columns: TableProps['columns']
} => {
  const customFields: { dataIndex: string; jsonPath: string }[] = []

  // Find all flatMap columns (type === 'flatMap')
  const flatMapColumns = additionalPrinterColumns?.filter(col => col.type === 'flatMap' && col.jsonPath) || []

  // Helper function to generate unique field names for flatMap columns
  const getFlatMapFieldNames = (columnName: string) => {
    // Sanitize column name: remove special chars, spaces, convert to camelCase
    const sanitizedName = columnName.replace(/[^a-zA-Z0-9]/g, '').replace(/^[a-z]/, char => char.toUpperCase())
    return {
      keyField: `_flatMap${sanitizedName}_Key`,
      valueField: `_flatMap${sanitizedName}_Value`,
    }
  }

  let columns: TableProps['columns'] = []
  if (additionalPrinterColumns) {
    columns = additionalPrinterColumns
      .map(({ name, jsonPath }) => {
        let newDataIndex: string | undefined
        let fieldsPath: string | string[] | undefined

        if (jsonPath) {
          if (jsonPath.includes('[')) {
            // newDataIndex = uuidv4()
            newDataIndex = JSON.stringify(jsonPath)
            customFields.push({ dataIndex: newDataIndex, jsonPath })
            // Handle paths that start with dot (e.g., ".metadata.name") or without dot (e.g., "_flatMapKey")
          } else if (jsonPath.startsWith('.')) {
            const pathParts = jsonPath.split('.').slice(1)
            // If only one field after dot, use string instead of array for Ant Design
            if (pathParts.length === 1) {
              // eslint-disable-next-line prefer-destructuring
              fieldsPath = pathParts[0]
            } else {
              fieldsPath = pathParts
            }
          } else {
            // Path without dot - treat as direct field name (use string for top-level fields)
            fieldsPath = jsonPath
          }
        }

        // For flatMap columns (type === 'flatMap'), skip the original column
        // User should define Key/Value columns manually with unique field names
        const isFlatMapColumn = flatMapColumns.some(col => col.name === name && col.jsonPath === jsonPath)
        if (isFlatMapColumn) {
          return null
        }

        return {
          title: name,
          dataIndex: newDataIndex || fieldsPath,
          key: name,
        }
      })
      .filter((col): col is NonNullable<typeof col> => col !== null)
  } else if (resourceSchema) {
    columns = [
      ...Object.keys(resourceSchema).map(el => ({
        title: el,
        dataIndex: el,
        key: el,
      })),
    ]
  }

  let dataSource: TableProps['dataSource'] = []
  if (additionalPrinterColumns) {
    dataSource = dataItems.map((el: TJSON) => {
      if (typeof el === 'object' && el !== null) {
        if (
          !Array.isArray(el) &&
          el.metadata &&
          typeof el.metadata === 'object' &&
          !Array.isArray(el.metadata) &&
          el.metadata.name &&
          dataForControls
        ) {
          const internalDataForControls = {
            cluster: dataForControls.cluster,
            syntheticProject: dataForControls.syntheticProject,
            pathPrefix: dataForControls.pathPrefix,
            apiGroupAndVersion: dataForControls.apiVersion,
            plural: dataForControls.plural,
            name: el.metadata.name,
            namespace: el.metadata.namespace || undefined,
            backlink: dataForControls.backlink,
            deletePathPrefix: dataForControls.deletePathPrefix,
            onDeleteHandle: dataForControls.onDeleteHandle,
            permissions: dataForControls.permissions,
          }
          const key = pathToKey
            ? jp.query(el, `$${pathToKey}`)[0]
            : `${el.metadata.name}${el.metadata.namespace ? `-${el.metadata.namespace}` : ''}`
          return {
            key,
            ...el,
            internalDataForControls,
          }
        }

        const key = pathToKey ? jp.query(el, `$${pathToKey}`)[0] : JSON.stringify(el)
        return { key, ...el }
      }
      // impossible in k8s
      return {}
    })
    if (customFields.length > 0) {
      dataSource = dataSource.map((el: TJSON) => {
        const newFieldsForComplexJsonPath: Record<string, TJSON> = {}
        customFields.forEach(({ dataIndex, jsonPath }) => {
          const jpQueryResult = jp.query(el || {}, `$${jsonPath}`)
          newFieldsForComplexJsonPath[dataIndex] =
            Array.isArray(jpQueryResult) && jpQueryResult.length === 1 ? jpQueryResult[0] : jpQueryResult
        })
        if (typeof el === 'object') {
          return { ...el, ...newFieldsForComplexJsonPath }
        }
        // impossible in k8s
        return { ...newFieldsForComplexJsonPath }
      })
    }

    // Handle flatMap: expand rows for map objects
    // Process all flatMap columns sequentially
    if (flatMapColumns.length > 0 && dataSource) {
      let currentDataSource = dataSource
      flatMapColumns.forEach(flatMapColumn => {
        if (!flatMapColumn.jsonPath) return

        const expandedDataSource: any[] = []
        const { keyField, valueField } = getFlatMapFieldNames(flatMapColumn.name)

        currentDataSource.forEach((el: TJSON) => {
          if (!el || typeof el !== 'object' || Array.isArray(el)) {
            return
          }

          const mapValue = jp.query(el || {}, `$${flatMapColumn.jsonPath}`)[0]

          // If the value is an object (map), expand it into multiple rows
          if (mapValue && typeof mapValue === 'object' && !Array.isArray(mapValue) && mapValue !== null) {
            const mapEntries = Object.entries(mapValue)

            if (mapEntries.length > 0) {
              // Create one row per key-value pair
              mapEntries.forEach(([key, value]) => {
                const elKey = (el as any).key || JSON.stringify(el)
                expandedDataSource.push({
                  ...(el as Record<string, any>),
                  [keyField]: key,
                  [valueField]: value,
                  // Update key to include the map key for uniqueness
                  key: `${elKey}-${flatMapColumn.jsonPath}-${key}`,
                })
              })
            } else {
              // Empty map - still create one row
              expandedDataSource.push({
                ...(el as Record<string, any>),
                [keyField]: null,
                [valueField]: null,
              })
            }
          } else {
            // Not a map or empty - keep original row but add null flatMap fields
            expandedDataSource.push({
              ...(el as Record<string, any>),
              [keyField]: null,
              [valueField]: null,
            })
          }
        })

        currentDataSource = expandedDataSource
      })
      dataSource = currentDataSource
    }
  } else {
    dataSource = dataItems.map((el: TJSON) => {
      if (typeof el === 'object' && el !== null && !Array.isArray(el) && el.spec && typeof el.spec === 'object') {
        if (
          !Array.isArray(el) &&
          el.metadata &&
          typeof el.metadata === 'object' &&
          !Array.isArray(el.metadata) &&
          el.metadata.name &&
          dataForControls
        ) {
          const internalDataForControls = {
            cluster: dataForControls.cluster,
            synthetichProject: dataForControls.syntheticProject,
            pathPrefix: dataForControls.pathPrefix,
            apiGroupAndVersion: dataForControls.apiVersion,
            plural: dataForControls.plural,
            name: el.metadata.name,
            namespace: el.metadata.namespace || undefined,
            backlink: dataForControls.backlink,
            deletePathPrefix: dataForControls.deletePathPrefix,
            onDeleteHandle: dataForControls.onDeleteHandle,
            permissions: dataForControls.permissions,
          }
          const key = pathToKey
            ? jp.query(el, `$${pathToKey}`)[0]
            : `${el.metadata.name}${el.metadata.namespace ? `-${el.metadata.namespace}` : ''}`
          return {
            key,
            ...el.spec,
            internalDataForControls,
          }
        }
        const key = pathToKey ? jp.query(el, `$${pathToKey}`)[0] : JSON.stringify(el.spec)
        return { key, ...el.spec }
      }
      // impossible in k8s
      return {}
    })
  }

  return { dataSource, columns }
}
