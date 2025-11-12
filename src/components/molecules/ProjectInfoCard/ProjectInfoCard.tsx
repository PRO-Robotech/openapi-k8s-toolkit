/* eslint-disable max-lines-per-function */
import React, { FC, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { usePermissions } from 'hooks/usePermissions'
import { DeleteModal, Spacer } from 'components/atoms'
import { Typography, Flex, Spin } from 'antd'
import { TMarketPlacePanelResponse } from 'localTypes/marketplace'
import { MarketplaceCard } from 'components/molecules'
import { DropdownActions, DropdownAccessGroups } from './molecules'
import { Styled } from './styled'

export type TProjectInfoCardProps = {
  clusterName?: string
  namespace?: string
  baseApiGroup: string
  baseApiVersion: string
  baseProjectApiGroup: string
  baseProjectVersion: string
  projectResourceName: string
  mpResourceName: string
  baseprefix?: string
  accessGroups: string[]
  showZeroResources?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any
}

export const ProjectInfoCard: FC<TProjectInfoCardProps> = ({
  clusterName,
  namespace,
  baseApiGroup,
  baseApiVersion,
  baseProjectApiGroup,
  baseProjectVersion,
  mpResourceName,
  projectResourceName,
  baseprefix,
  accessGroups,
  showZeroResources,
  children,
}) => {
  const navigate = useNavigate()

  const {
    data: marketplacePanels,
    isLoading: marketplaceIsLoading,
    // error: marketplaceError,
  } = useK8sSmartResource<TMarketPlacePanelResponse>({
    cluster: clusterName || '',
    group: baseApiGroup,
    version: baseApiVersion,
    plural: mpResourceName,
    isEnabled: Boolean(clusterName !== undefined),
  })

  const {
    data: projectArr,
    isLoading,
    error,
  } = useK8sSmartResource<{
    items: {
      apiVersion: string
      kind: 'Project'
      metadata: {
        labels: {
          paas: string
          pj: string
        }
        name: string
        resourceVersion: string
        uid: string
      }
      spec: {
        businessName?: string
        description: string
        prefix: string
      }
      status: {
        conditions: {
          lastTransitionTime: string
          message: string
          reason: string
          status: string
          type: string
        }[]
      }
    }[]
  }>({
    cluster: clusterName || '',
    group: baseProjectApiGroup,
    version: baseProjectVersion,
    plural: projectResourceName,
    fieldSelector: `metadata.name=${namespace}`,
    isEnabled: Boolean(clusterName !== undefined),
  })

  const project = projectArr && projectArr.items && projectArr.items.length > 0 ? projectArr.items[0] : undefined

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)

  const updatePermission = usePermissions({
    group: baseProjectApiGroup,
    resource: projectResourceName,
    clusterName: clusterName || '',
    verb: 'update',
    refetchInterval: false,
  })

  const deletePermission = usePermissions({
    group: baseProjectApiGroup,
    resource: projectResourceName,
    clusterName: clusterName || '',
    verb: 'delete',
    refetchInterval: false,
  })

  const openUpdate = useCallback(() => {
    navigate(
      `/${baseprefix}/${clusterName}/forms/apis/${baseProjectApiGroup}/${baseProjectVersion}/${projectResourceName}/${namespace}?backlink=${baseprefix}/clusters/${clusterName}`,
    )
  }, [baseprefix, clusterName, namespace, baseProjectApiGroup, baseProjectVersion, projectResourceName, navigate])

  if (isLoading) {
    return <Spin />
  }

  if (!project || error) {
    return null
  }

  const readyCondition = project.status.conditions.find(({ type }: { type: string }) => type === 'Ready')

  return (
    <>
      <Flex justify="space-between">
        <div>{children}</div>
        <div>
          <Flex gap={24} vertical>
            <Flex justify="flex-end">
              {readyCondition?.status === 'True' &&
              (updatePermission.data?.status.allowed || deletePermission.data?.status.allowed) ? (
                <DropdownActions
                  onDelete={
                    deletePermission.data?.status.allowed
                      ? () => {
                          setIsDeleteModalOpen(true)
                        }
                      : undefined
                  }
                  onUpdate={updatePermission.data?.status.allowed ? openUpdate : undefined}
                />
              ) : (
                <Styled.ActionMenuPlaceholder />
              )}
            </Flex>
            <DropdownAccessGroups accessGroups={accessGroups} />
          </Flex>
        </div>
      </Flex>
      <Spacer $space={24} $samespace />
      <Typography.Text type="secondary">Added Products</Typography.Text>
      <Spacer $space={12} $samespace />
      <Flex gap={22} wrap>
        {marketplaceIsLoading && <Spin />}
        {clusterName &&
          namespace &&
          marketplacePanels?.items
            .map(({ spec }) => spec)
            .sort()
            .map(({ name, description, icon, type, pathToNav, typeName, apiGroup, apiVersion, tags, disabled }) => (
              <MarketplaceCard
                baseprefix={baseprefix}
                key={name}
                description={description}
                disabled={disabled}
                icon={icon}
                isEditMode={false}
                name={name}
                clusterName={clusterName}
                namespace={namespace}
                type={type}
                pathToNav={pathToNav}
                typeName={typeName}
                apiGroup={apiGroup}
                apiVersion={apiVersion}
                tags={tags}
                showZeroResources={showZeroResources}
                addedMode
              />
            ))}
      </Flex>
      {isDeleteModalOpen && (
        <DeleteModal
          name={project.metadata.name}
          onClose={() => {
            setIsDeleteModalOpen(false)
            navigate(`${baseprefix}/clusters/${clusterName}`)
          }}
          endpoint={`/api/clusters/${clusterName}/k8s/apis/${baseProjectApiGroup}/${baseProjectVersion}/${projectResourceName}/${project.metadata.name}`}
        />
      )}
    </>
  )
}
