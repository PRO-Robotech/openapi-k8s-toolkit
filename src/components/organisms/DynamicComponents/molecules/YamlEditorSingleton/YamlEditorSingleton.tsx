/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState, useEffect } from 'react'
import { YamlEditorSingleton as Editor } from 'components/molecules/YamlEditorSingleton'
import { usePermissions } from 'hooks/usePermissions'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll } from '../utils'
import { getDataByPath, getPrefillValuesWithForces } from './utils'

export const YamlEditorSingleton: FC<{ data: TDynamicComponentsAppTypeMap['YamlEditorSingleton']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    cluster,
    isNameSpaced,
    type,
    apiGroup,
    apiVersion,
    plural,
    forcedKind,
    prefillValuesRequestIndex,
    pathToData,
    substractHeight,
    permissions,
    permissionContext,
    ...props
  } = data

  const [height, setHeight] = useState(0)

  useEffect(() => {
    const height = window.innerHeight - (substractHeight || 340)
    setHeight(height)

    const handleResize = () => {
      setHeight(height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [substractHeight])

  const theme = useTheme()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const safeMultiQueryData = multiQueryData || {}
  const permissionContextPrepared = permissionContext
    ? {
        cluster: parseAll({ text: permissionContext.cluster, replaceValues, multiQueryData: safeMultiQueryData }),
        namespace: permissionContext.namespace
          ? parseAll({ text: permissionContext.namespace, replaceValues, multiQueryData: safeMultiQueryData })
          : undefined,
        apiGroup: permissionContext.apiGroup
          ? parseAll({ text: permissionContext.apiGroup, replaceValues, multiQueryData: safeMultiQueryData })
          : undefined,
        plural: parseAll({ text: permissionContext.plural, replaceValues, multiQueryData: safeMultiQueryData }),
      }
    : undefined

  const isPermissionContextValid =
    !!permissionContextPrepared &&
    !isMultiqueryLoading &&
    !!permissionContextPrepared.cluster &&
    permissionContextPrepared.cluster !== '-' &&
    !!permissionContextPrepared.plural &&
    permissionContextPrepared.plural !== '-'

  const updatePermission = usePermissions({
    cluster: permissionContextPrepared?.cluster || '',
    namespace: permissionContextPrepared?.namespace,
    apiGroup: permissionContextPrepared?.apiGroup,
    plural: permissionContextPrepared?.plural || '',
    verb: 'update',
    refetchInterval: false,
    enabler: isPermissionContextValid,
  })

  // Permission gating for update-based edit:
  // 1) canUpdate: Manual permissions override hook result if provided.
  // 2) shouldGateEdit: True when permissions or permissionContext are provided; otherwise don't gate.
  // 3) canEdit: Allow edit when not readOnly and either gating is off or canUpdate === true.
  const canUpdate = permissions?.canUpdate ?? updatePermission.data?.status.allowed
  const shouldGateEdit = Boolean(permissions || permissionContext)
  const canEdit = !shouldGateEdit || canUpdate === true

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })

  const apiGroupPrepared = apiGroup ? parseAll({ text: apiGroup, replaceValues, multiQueryData }) : 'no-api-group'

  const apiVersionPrepared = apiVersion
    ? parseAll({ text: apiVersion, replaceValues, multiQueryData })
    : 'no-api-version'

  const pluralPrepared = parseAll({ text: plural, replaceValues, multiQueryData })

  const prefillValuesRaw = multiQueryData[`req${prefillValuesRequestIndex}`]
  const prefillValues = pathToData ? getDataByPath({ prefillValuesRaw, pathToData }) : prefillValuesRaw
  const prefillValuesWithForces = getPrefillValuesWithForces({ prefillValues, forcedKind, apiGroup, apiVersion })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <>
      <Editor
        cluster={clusterPrepared}
        theme={theme}
        prefillValuesSchema={prefillValuesWithForces}
        isNameSpaced={isNameSpaced}
        isCreate={false}
        type={type}
        apiGroupApiVersion={type === 'builtin' ? 'api/v1' : `${apiGroupPrepared}/${apiVersionPrepared}`}
        plural={pluralPrepared}
        designNewLayout
        designNewLayoutHeight={height}
        openNotification
        canEdit={canEdit}
        {...props}
      />
      {children}
    </>
  )
}
