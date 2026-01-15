export const getContainerNames = (
  pod: unknown & {
    status: unknown & {
      containerStatuses: { name: string }[]
      initContainerStatuses: { name: string }[]
    }
  },
): { containers: string[]; initContainers: string[] } => {
  const containers = (pod.status?.containerStatuses ?? []).map(st => st.name)
  const initContainers = (pod.status?.initContainerStatuses ?? []).map(st => st.name)
  return { containers, initContainers }
}
