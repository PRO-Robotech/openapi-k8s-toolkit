import axios, { AxiosResponse } from 'axios'

export const checkPermission = async ({
  cluster,
  body,
}: {
  cluster: string
  body: {
    apiGroup?: string
    plural: string
    verb: 'get' | 'list' | 'watch' | 'create' | 'delete' | 'patch' | 'update'
    namespace?: string
    name?: string
    subresource?: string
  }
}): Promise<
  AxiosResponse<{
    status: {
      allowed?: boolean
    }
  }>
> => {
  const data = JSON.stringify({
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    spec: {
      resourceAttributes: {
        ...(body.apiGroup ? { group: body.apiGroup } : {}),
        resource: body.plural,
        ...(body.subresource ? { subresource: body.subresource } : {}),
        verb: body.verb,
        ...(body.namespace ? { namespace: body.namespace } : {}),
        ...(body.name ? { name: body.name } : {}),
      },
    },
  })
  return axios.post(`/api/clusters/${cluster}/k8s/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`, data, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
