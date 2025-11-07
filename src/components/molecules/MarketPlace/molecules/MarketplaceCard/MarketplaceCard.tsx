/* eslint-disable react/no-danger */
import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Flex, theme } from 'antd'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
// import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { TMarketPlacePanel } from 'localTypes/marketplace'
// import { getPathToNav, getCreatePathToNav, getListPath } from './utils'
import { getPathToNav, getCreatePathToNav } from './utils'
import { Styled } from './styled'

export type TMarketplaceCardProps = {
  baseprefix?: string
  clusterName: string
  namespace: string
  isEditMode?: boolean
  onDeleteClick?: () => void
  onEditClick?: () => void
  addedMode?: boolean
  standalone?: boolean
  showZeroResources?: boolean
} & Omit<TMarketPlacePanel, 'hidden'>

export const MarketplaceCard: FC<TMarketplaceCardProps> = ({
  baseprefix,
  description,
  name,
  icon,
  clusterName,
  namespace,
  type,
  pathToNav,
  typeName,
  apiGroup,
  apiVersion,
  tags,
  disabled,
  isEditMode,
  onDeleteClick,
  onEditClick,
  addedMode,
  standalone,
  showZeroResources,
}) => {
  const { useToken } = theme
  const { token } = useToken()
  const navigate = useNavigate()

  let decodedIcon = ''

  try {
    decodedIcon = window.atob(icon)
  } catch {
    decodedIcon = "Can't decode"
  }

  const navigateUrl =
    addedMode || standalone
      ? getPathToNav({
          clusterName,
          namespace,
          type,
          pathToNav,
          typeName,
          apiGroup,
          apiVersion,
          baseprefix,
        })
      : getCreatePathToNav({
          clusterName,
          namespace,
          type,
          pathToNav,
          typeName,
          apiGroup,
          apiVersion,
          baseprefix,
        })

  // const listUrl: string | undefined =
  //   addedMode && type !== 'direct'
  //     ? getListPath({
  //         clusterName,
  //         namespace,
  //         type,
  //         typeName,
  //         apiGroup,
  //         apiVersion,
  //       })
  //     : undefined

  // const { data: k8sList, error: k8sListError } = useDirectUnknownResource<{ items?: [] }>({
  //   uri: listUrl || '',
  //   queryKey: [listUrl || ''],
  //   refetchInterval: false,
  //   isEnabled: addedMode && listUrl !== undefined,
  // })

  const { data: k8sList, error: k8sListError } = useK8sSmartResource<{ items?: [] }>({
    cluster: clusterName || '',
    namespace,
    group: apiGroup,
    version: apiVersion || '',
    plural: type,
    isEnabled: Boolean(apiVersion && addedMode && type !== 'direct'),
  })

  if (addedMode && (k8sListError || type === 'direct') && !showZeroResources) {
    return null
  }

  return (
    <Styled.CustomCard
      $isDisabled={disabled}
      $hoverColor={token.colorPrimary}
      onClick={() => (disabled ? null : navigate(navigateUrl))}
    >
      <Flex vertical style={{ width: '100%', height: '100%' }} justify="spaceBetween">
        <Flex justify="space-between">
          <Styled.ImageContainer dangerouslySetInnerHTML={{ __html: decodedIcon }} />
          {isEditMode && (
            <div
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                if (onDeleteClick) {
                  onDeleteClick()
                }
              }}
            >
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10.5 0C4.70156 0 0 4.70156 0 10.5C0 16.2984 4.70156 21 10.5 21C16.2984 21 21 16.2984 21 10.5C21 4.70156 16.2984 0 10.5 0ZM15 11.0625C15 11.1656 14.9156 11.25 14.8125 11.25H6.1875C6.08437 11.25 6 11.1656 6 11.0625V9.9375C6 9.83438 6.08437 9.75 6.1875 9.75H14.8125C14.9156 9.75 15 9.83438 15 9.9375V11.0625Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          )}
        </Flex>
        <Styled.OverflowContainer>
          <Styled.TitleContainer>
            {name} {addedMode && <span>x{k8sList?.items?.length}</span>}
          </Styled.TitleContainer>
          <Styled.TagsContainer>
            {tags.map(tag => (
              <Styled.CustomTag key={tag}>{tag}</Styled.CustomTag>
            ))}
          </Styled.TagsContainer>
          <Styled.DescriptionContainer>
            <Typography.Text type="secondary">{description}</Typography.Text>
          </Styled.DescriptionContainer>
        </Styled.OverflowContainer>
        <Styled.EditButtonContainer>
          {isEditMode && (
            <div
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                if (onEditClick) {
                  onEditClick()
                }
              }}
            >
              <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17.28 16.79H0.72C0.32175 16.79 0 17.1117 0 17.51V18.32C0 18.419 0.081 18.5 0.18 18.5H17.82C17.919 18.5 18 18.419 18 18.32V17.51C18 17.1117 17.6783 16.79 17.28 16.79ZM3.27825 14.9C3.32325 14.9 3.36825 14.8955 3.41325 14.8888L7.19775 14.225C7.24275 14.216 7.2855 14.1958 7.317 14.162L16.8547 4.62425C16.8756 4.60343 16.8922 4.57871 16.9034 4.55149C16.9147 4.52427 16.9205 4.49509 16.9205 4.46562C16.9205 4.43616 16.9147 4.40698 16.9034 4.37976C16.8922 4.35254 16.8756 4.32782 16.8547 4.307L13.1153 0.56525C13.0725 0.5225 13.0163 0.5 12.9555 0.5C12.8948 0.5 12.8385 0.5225 12.7958 0.56525L3.258 10.103C3.22425 10.1367 3.204 10.1772 3.195 10.2222L2.53125 14.0067C2.50936 14.1273 2.51718 14.2513 2.55404 14.3682C2.59089 14.485 2.65566 14.5911 2.74275 14.6772C2.89125 14.8212 3.078 14.9 3.27825 14.9Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          )}
        </Styled.EditButtonContainer>
      </Flex>
    </Styled.CustomCard>
  )
}
