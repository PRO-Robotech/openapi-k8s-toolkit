/* eslint-disable max-lines-per-function */
import React, { FC, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListWatch } from 'hooks/useListThenWatch'
// import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { usePermissions } from 'hooks/usePermissions'
import { DeleteModal, Spacer } from 'components/atoms'
import { Typography, Flex, Spin } from 'antd'
// import { TMarketPlacePanelResponse } from 'localTypes/marketplace'
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

  // const {
  //   data: marketplacePanels,
  //   isLoading: marketplaceIsLoading,
  //   // error: marketplaceError,
  // } = useDirectUnknownResource<TMarketPlacePanelResponse>({
  //   uri: `/api/clusters/${clusterName}/k8s/apis/${baseApiGroup}/${baseApiVersion}/${mpResourceName}/`,
  //   refetchInterval: 5000,
  //   queryKey: ['marketplacePanels', clusterName || 'no-cluster'],
  //   isEnabled: clusterName !== undefined,
  // })

  const { state, status } = useListWatch({
    wsUrl: `/api/clusters/${clusterName}/openapi-bff-ws/listThenWatch/listWatchWs`,
    paused: false,
    ignoreRemove: false,
    autoDrain: true,
    preserveStateOnUrlChange: true,
    query: {
      apiVersion: baseApiVersion,
      apiGroup: baseApiGroup,
      plural: mpResourceName,
    },
    isEnabled: clusterName !== undefined,
  })

  const marketplaceIsLoading = status === 'connecting'
  const marketplacePanels = {
    items: state.order.map(key => {
      const res = state.byKey[key]
      return res
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as { items: any[] }

  // const {
  //   data: project,
  //   isLoading,
  //   error,
  // } = useDirectUnknownResource<{
  //   apiVersion: string
  //   kind: 'Project'
  //   metadata: {
  //     labels: {
  //       paas: string
  //       pj: string
  //     }
  //     name: string
  //     resourceVersion: string
  //     uid: string
  //   }
  //   spec: {
  //     businessName?: string
  //     description: string
  //     prefix: string
  //   }
  //   status: {
  //     conditions: {
  //       lastTransitionTime: string
  //       message: string
  //       reason: string
  //       status: string
  //       type: string
  //     }[]
  //   }
  // }>({
  //   uri: `/api/clusters/${clusterName}/k8s/apis/${baseProjectApiGroup}/${baseProjectVersion}/${projectResourceName}/${namespace}`,
  //   refetchInterval: 5000,
  //   queryKey: ['projects', clusterName || 'no-cluster'],
  //   isEnabled: clusterName !== undefined,
  // })

  const {
    state: stateProject,
    status: statusProject,
    lastError: lastErrorProject,
  } = useListWatch({
    wsUrl: `/api/clusters/${clusterName}/openapi-bff-ws/listThenWatch/listWatchWs`,
    paused: false,
    ignoreRemove: false,
    autoDrain: true,
    preserveStateOnUrlChange: true,
    query: {
      apiVersion: baseProjectVersion,
      apiGroup: baseProjectApiGroup,
      plural: projectResourceName,
      fieldSelector: `metadata.name=${namespace}`,
    },
    isEnabled: clusterName !== undefined,
  })

  const isLoading = statusProject === 'connecting'
  const error = statusProject === 'closed' && lastErrorProject ? lastErrorProject : undefined
  const projectArr = stateProject.order.map(key => {
    const res = stateProject.byKey[key]
    return res
  })
  const project = projectArr.length > 0 ? projectArr[0] : undefined

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
