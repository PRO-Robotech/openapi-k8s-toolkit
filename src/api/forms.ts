import axios, { AxiosResponse } from 'axios'

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

  const addOp = [
    {
      op: 'add',
      path: pathToValue,
      value: body,
    },
  ]

  const replaceOp = [
    {
      op: 'replace',
      path: pathToValue,
      value: body,
    },
  ]

  try {
    await axios.patch<T>(endpoint, addOp, config)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error trying to add: ${error}`)
  }

  return axios.patch<T>(endpoint, replaceOp, config)
}

export const patchEntryWithDeleteOp = async <T>({
  endpoint,
  pathToValue,
}: {
  endpoint: string
  pathToValue: string
}): Promise<AxiosResponse<T>> => {
  const config = {
    headers: {
      'Content-Type': 'application/json-patch+json',
    },
  }

  const replaceOp = [
    {
      op: 'remove',
      path: pathToValue,
    },
  ]

  return axios.patch<T>(endpoint, replaceOp, config)
}
