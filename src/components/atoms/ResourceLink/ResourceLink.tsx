import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, Typography } from 'antd'
import { getUppercase } from 'utils/getUppercase'
import { hslFromString } from 'utils/hslFromString'
import { getResourceLink } from 'utils/getResourceLink'
import { Styled } from './styled'

type TResourceLinkProps = {
  kind?: string
  apiVersion: string
  namespace?: string
  name?: string
  forcedName?: string
  theme: 'dark' | 'light'
  baseprefix?: string
  cluster: string
  getPlural?: (kind: string, apiVersion?: string) => string | undefined
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
}

export const ResourceLink: FC<TResourceLinkProps> = ({
  kind,
  apiVersion,
  namespace,
  name,
  forcedName,
  theme,
  baseprefix,
  cluster,
  getPlural,
  baseFactoryNamespacedAPIKey,
  baseFactoryClusterSceopedAPIKey,
  baseFactoryNamespacedBuiltinKey,
  baseFactoryClusterSceopedBuiltinKey,
}) => {
  const navigate = useNavigate()

  const abbr = kind ? getUppercase(kind) : undefined
  const bgColor = kind && abbr ? hslFromString(kind, theme) : 'initial'

  const parsedKind: string | undefined = kind
  const parsedApiVersion: string = apiVersion

  const pluralName: string | undefined =
    parsedKind && parsedApiVersion ? getPlural?.(parsedKind, parsedApiVersion) : undefined

  const resourceLink: string | undefined = getResourceLink({
    baseprefix,
    cluster,
    namespace,
    apiGroupVersion: parsedApiVersion,
    pluralName,
    name,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
  })

  return (
    <Flex align="center" gap={8}>
      <Styled.Abbr $bgColor={bgColor}>{abbr}</Styled.Abbr>
      {resourceLink ? (
        <Typography.Link
          onClick={e => {
            e.preventDefault()
            navigate(resourceLink)
          }}
        >
          {forcedName || name}
        </Typography.Link>
      ) : (
        <Typography.Text>{forcedName || name}</Typography.Text>
      )}
    </Flex>
  )
}
