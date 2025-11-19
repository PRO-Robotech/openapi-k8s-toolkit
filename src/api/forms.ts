import axios, { AxiosResponse, isAxiosError } from 'axios'

export const createNewEntry = async <T>({
  endpoint,
  body,
}: {
  endpoint: string
  body: unknown
}): Promise<AxiosResponse<T>> => {
  return axios.post(endpoint, JSON.stringify(body), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const updateEntry = async <T>({
  endpoint,
  body,
}: {
  endpoint: string
  body: unknown
}): Promise<AxiosResponse<T>> => {
  return axios.put(endpoint, JSON.stringify(body), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const deleteEntry = async <T>({ endpoint }: { endpoint: string }): Promise<AxiosResponse<T>> => {
  return axios.delete(endpoint)
}

export const patchEntryWithReplaceOp = async <T>({
  endpoint,
  pathToValue,
  body,
}: {
  endpoint: string
  pathToValue: string
  body: unknown
}): Promise<AxiosResponse<T>> => {
  const config = {
    headers: {
      'Content-Type': 'application/json-patch+json',
    },
  }

  const replaceOp = [
    {
      op: 'replace',
      path: pathToValue,
      value: body,
    },
  ]

  try {
    // 1. Try replace first
    return await axios.patch<T>(endpoint, replaceOp, config)
  } catch (error) {
    // If it's NOT an axios error, rethrow — something else went wrong
    if (!isAxiosError(error)) {
      throw error
    }

    // If it's not a k8s-style validation error, just rethrow
    const status = error.response?.status
    if (status !== 422) {
      throw error
    }

    // 2. Fallback: try add (for paths that didn't exist yet)
    const addOp = [
      {
        op: 'add',
        path: pathToValue,
        value: body,
      },
    ]

    return axios.patch<T>(endpoint, addOp, config)
  }
}
