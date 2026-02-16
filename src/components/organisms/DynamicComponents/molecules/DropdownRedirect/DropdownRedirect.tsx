/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useMemo } from 'react'
import { Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import jp from 'jsonpath'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll, parseWithoutPartsOfUrl } from '../utils'
import { Styled } from './styled'

type TResourceList = {
  items?: Record<string, unknown>[]
}

export const DropdownRedirect: FC<{ data: TDynamicComponentsAppTypeMap['DropdownRedirect']; children?: any }> = ({
  data,
  children,
}) => {
  const {
    cluster,
    apiVersion,
    apiGroup,
    namespace,
    plural,
    jsonPath,
    redirectUrl,
    currentValue,
    placeholder = 'Select...',
    style,
    showSearch = true,
    loading: externalLoading,
    popupMatchSelectWidth,
  } = data

  const navigate = useNavigate()
  const { data: multiQueryData, isLoading: isMultiQueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const UNDEFINED_FALLBACK = '~undefined-value~'

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })
  const apiVersionPrepared = parseAll({ text: apiVersion, replaceValues, multiQueryData })
  const apiGroupPrepared = apiGroup ? parseAll({ text: apiGroup, replaceValues, multiQueryData }) : undefined
  const namespacePrepared = namespace ? parseAll({ text: namespace, replaceValues, multiQueryData }) : undefined
  const pluralPrepared = parseAll({ text: plural, replaceValues, multiQueryData })

  const currentValueRaw = currentValue
    ? parseWithoutPartsOfUrl({ text: currentValue, multiQueryData, customFallback: UNDEFINED_FALLBACK })
    : undefined

  const currentValuePrepared = currentValueRaw === UNDEFINED_FALLBACK ? undefined : currentValueRaw

  const {
    data: resourceList,
    isLoading: isResourceLoading,
    isError,
  } = useK8sSmartResource<TResourceList>({
    cluster: clusterPrepared,
    apiGroup: apiGroupPrepared,
    apiVersion: apiVersionPrepared,
    plural: pluralPrepared,
    namespace: namespacePrepared,
    isEnabled: Boolean(clusterPrepared && apiVersionPrepared && pluralPrepared && !isMultiQueryLoading),
  })

  const options = useMemo(() => {
    if (!resourceList?.items?.length) return []

    return resourceList.items
      .map(item => {
        try {
          const results = jp.query(item, `$${jsonPath}`)
          const value = results?.[0]
          return value !== undefined && value !== null ? String(value) : null
        } catch {
          return null
        }
      })
      .filter((v): v is string => v !== null)
      .map(value => ({ label: value, value }))
  }, [resourceList, jsonPath])

  const isLoading = isMultiQueryLoading || isResourceLoading || externalLoading

  const handleChange = (selectedValue: unknown) => {
    if (typeof selectedValue !== 'string') return

    const urlWithChosenValue = redirectUrl.replace(/\{chosenEntryValue\}/g, selectedValue)

    const finalUrl = parseAll({
      text: urlWithChosenValue,
      replaceValues,
      multiQueryData,
    })

    navigate(finalUrl)
  }

  if (isLoading) {
    return <Spin size="small" />
  }

  if (isError) {
    return <span>Error loading resources</span>
  }

  return (
    <>
      <Styled.TitleSelect
        value={currentValuePrepared}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        style={style}
        showSearch={showSearch}
        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        variant="borderless"
        popupMatchSelectWidth={popupMatchSelectWidth}
      />
      {children}
    </>
  )
}
