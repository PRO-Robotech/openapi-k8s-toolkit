import { Link } from 'react-router-dom'
import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb'
import { prepareTemplate } from 'utils/prepareTemplate'
import { TLink } from './types'

const mapLinksFromRaw = ({
  rawLinks,
  replaceValues,
}: {
  rawLinks: TLink[]
  replaceValues: Record<string, string | undefined>
}): BreadcrumbItemType[] => {
  return rawLinks.map(({ key, label, link }) => {
    return {
      key,
      title: link ? (
        <Link
          to={prepareTemplate({
            template: link,
            replaceValues,
          })}
        >
          {prepareTemplate({
            template: label,
            replaceValues,
          })}
        </Link>
      ) : (
        prepareTemplate({
          template: label,
          replaceValues,
        })
      ),
    }
  })
}

export const prepareDataForManageableBreadcrumbs = ({
  data,
  replaceValues,
  idToCompare,
}: {
  data: ({ id: string; breadcrumbItems: TLink[] } | undefined)[]
  replaceValues: Record<string, string | undefined>
  pathname: string
  idToCompare: string
}): { breadcrumbItems: BreadcrumbItemType[] } | undefined => {
  const foundData = data.find(el => el?.id === idToCompare)

  if (!foundData) {
    return undefined
  }

  const result = {
    breadcrumbItems: mapLinksFromRaw({
      rawLinks: foundData.breadcrumbItems,
      replaceValues,
    }),
  }

  return result
}
