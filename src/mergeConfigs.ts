import path from 'path'
import * as core from '@actions/core'

export default function mergeConfigs(main: any, sub: any, repoName: string) {
  const mainTabs = main?.navigation?.tabs || []
  const subTabs = sub?.navigation?.tabs || []
  const subTabsWithrepoName = subTabs.map((tab: any) => {
    const repoNameedTabs = repoNamePagesInObjectGraph(tab, repoName)
    return repoNameedTabs
  })
  const mergedTabs = [...mainTabs, ...subTabsWithrepoName]
  return {
    ...main,
    navigation: {
      ...main.navigation,
      tabs: mergedTabs
    }
  }
}

function repoNamePagesInObjectGraph(obj: any, repoName: string): any {
  if (typeof obj !== 'object' || obj === null) return obj

  if (Array.isArray(obj.pages)) {
    obj.pages = obj.pages.map((page: string) => {
      page = page.replace(/^docs\//, '') // Strip leading "docs/"
      const newPage = path.join('docs', repoName, page)
      core.info(`Changed page from ${page} to ${newPage}`)
      return newPage
    })
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => repoNamePagesInObjectGraph(item, repoName))
        } else {
          repoNamePagesInObjectGraph(value, repoName)
        }
      }
    }
  }

  return obj
}
