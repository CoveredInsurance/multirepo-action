export default function mergeConfigs(main: any, sub: any, prefix: string) {
  const mainTabs = main?.navigation?.tabs || []
  const subTabs = sub?.navigation?.tabs || []
  const subTabsWithPrefix = subTabs.map((tab: any) => {
    const prefixedTabs = prefixPagesInObjectGraph(tab, prefix)
    return prefixedTabs
  })
  const mergedTabs = [...mainTabs, ...subTabsWithPrefix]
  return {
    ...main,
    navigation: {
      ...main.navigation,
      tabs: mergedTabs
    }
  }
}

function prefixPagesInObjectGraph(obj: any, prefix: string): any {
  if (typeof obj !== 'object' || obj === null) return obj

  if (Array.isArray(obj.pages)) {
    obj.pages = obj.pages.map((page: string) => `${prefix}/${page}`)
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => prefixPagesInObjectGraph(item, prefix))
        } else {
          prefixPagesInObjectGraph(value, prefix)
        }
      }
    }
  }

  return obj
}
