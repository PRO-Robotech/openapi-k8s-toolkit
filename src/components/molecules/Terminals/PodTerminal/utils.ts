export const getScopedContainerNames = (containers: string[], containerName?: string): string[] => {
  const normalizedContainerName = containerName?.trim()

  if (!normalizedContainerName) {
    return containers
  }

  return containers.filter(container => container === normalizedContainerName)
}
