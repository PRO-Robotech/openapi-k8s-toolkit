import { FC, useMemo } from 'react'
import { Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import jp from 'jsonpath'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useListWatch } from 'hooks/useListThenWatch'
import { parseAll } from '../utils'
import { Styled } from './styled'

export const DropdownRedirect: FC<{ data: TDynamicComponentsAppTypeMap['DropdownRedirect'] }> = ({ data }) => {
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
  } = data

  const navigate = useNavigate()
  const { data: multiQueryData, isLoading: isMultiQueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })
  const apiVersionPrepared = parseAll({ text: apiVersion, replaceValues, multiQueryData })
  const apiGroupPrepared = apiGroup ? parseAll({ text: apiGroup, replaceValues, multiQueryData }) : undefined
  const namespacePrepared = namespace ? parseAll({ text: namespace, replaceValues, multiQueryData }) : undefined
  const pluralPrepared = parseAll({ text: plural, replaceValues, multiQueryData })
  const currentValuePrepared = currentValue
    ? parseAll({ text: currentValue, replaceValues, multiQueryData })
    : undefined

  const { state, status, hasInitial } = useListWatch({
    wsUrl: `/api/clusters/${clusterPrepared}/openapi-bff-ws/listThenWatch/listWatchWs`,
    isEnabled: Boolean(clusterPrepared && apiVersionPrepared && pluralPrepared && !isMultiQueryLoading),
    autoDrain: true,
    query: {
      apiGroup: apiGroupPrepared,
      apiVersion: apiVersionPrepared,
      plural: pluralPrepared,
      namespace: namespacePrepared,
    },
  })

  const options = useMemo(() => {
    if (!hasInitial || !state.order.length) return []

    const items = state.order.map(key => state.byKey[key])

    return items
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
  }, [state, hasInitial, jsonPath])

  const isLoading =
    isMultiQueryLoading || status === 'connecting' || (status === 'open' && !hasInitial) || externalLoading

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

  return (
    <Styled.TitleSelect
      value={currentValuePrepared}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      style={style}
      showSearch={showSearch}
      filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
      variant="borderless"
    />
  )
}
