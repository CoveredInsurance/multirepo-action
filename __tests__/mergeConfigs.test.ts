import mergeConfigs from '../src/mergeConfigs'
import { mainConfig, lendersApiConfig } from './configurationSamples'

test("main config's properties are preserved", () => {
  const main = { foo: 'bar' }
  const sub = { foo: 'THIS IS OVERWRITTEN BY MAIN' }
  const result = mergeConfigs(main, sub, 'lenders-api')
  expect(result).toMatchObject({ foo: 'bar' })
})

test("main config's navigation property is preserved", () => {
  const expected = {}
  const main = { navigation: expected }
  const sub = { navigation: null }
  const result = mergeConfigs(main, sub, 'lenders-api')
  expect(result).toMatchObject({ navigation: expected })
})

test("main config's tabs are merged with sub config's tabs", () => {
  const main = {
    navigation: {
      tabs: [{ pages: ['A'] }]
    }
  }
  const sub = {
    navigation: {
      tabs: [{ pages: ['B', 'C'] }]
    }
  }
  const result = mergeConfigs(main, sub, 'prefix')
  expect(result.navigation.tabs[0].pages).toStrictEqual(['A'])
  expect(result.navigation.tabs[1].pages).toStrictEqual([
    'docs/prefix/B',
    'docs/prefix/C'
  ])
})

test("main config's navigation properties are preserved (aside from tabs which is merged)", () => {
  const main = {
    navigation: {
      foo: 'bar',
      tabs: ['A']
    }
  }
  const sub = {
    navigation: {
      foo: 'THIS IS OVERWRITTEN BY MAIN',
      tabs: ['B', 'C']
    }
  }
  const result = mergeConfigs(main, sub, 'lenders-api')
  expect(result.navigation).toMatchObject({ foo: 'bar' })
})

test("sub config's pages are prefixed", () => {
  const main = {
    navigation: { tabs: [{ pages: ['docs/should_not_get_prefixed'] }] }
  }
  const sub = {
    navigation: { tabs: [{ pages: ['docs/should_get_prefixed'] }] }
  }
  const result = mergeConfigs(main, sub, 'expected_prefix')
  expect(result.navigation.tabs[0].pages).toStrictEqual([
    'docs/should_not_get_prefixed'
  ])
  expect(result.navigation.tabs[1].pages).toStrictEqual([
    'docs/expected_prefix/should_get_prefixed'
  ])
})

test('it handles groups', () => {
  const main = {
    navigation: { tabs: [{ pages: ['docs/should_not_get_prefixed'] }] }
  }
  const sub = {
    navigation: {
      tabs: [
        {
          tab: 'Home',
          groups: [{ group: 'Overview', pages: ['docs/getting_started'] }]
        }
      ]
    }
  }
  const result = mergeConfigs(main, sub, 'expected_prefix')
  expect(result.navigation.tabs[0].pages).toStrictEqual([
    'docs/should_not_get_prefixed'
  ])
  const childTab = result.navigation.tabs[1]
  expect(childTab).toMatchObject({
    tab: 'Home',
    groups: [
      {
        group: 'Overview',
        pages: ['docs/expected_prefix/getting_started']
      }
    ]
  })
})

test('it handles multiple nested groups', () => {
  const main = {
    navigation: { tabs: [{ pages: ['docs/should_not_get_prefixed'] }] }
  }
  const sub = {
    navigation: {
      tabs: [
        {
          tab: 'Home',
          groups: [
            {
              group: 'Overview',
              pages: ['docs/getting_started']
            },
            {
              group: 'Advanced',
              pages: ['docs/advanced']
            }
          ]
        }
      ]
    }
  }
  const result = mergeConfigs(main, sub, 'expected_prefix')
  expect(result.navigation.tabs[0].pages).toStrictEqual([
    'docs/should_not_get_prefixed'
  ])
  const childTab = result.navigation.tabs[1]
  expect(childTab).toMatchObject({
    tab: 'Home',
    groups: [
      {
        group: 'Overview',
        pages: ['docs/expected_prefix/getting_started']
      },
      {
        group: 'Advanced',
        pages: ['docs/expected_prefix/advanced']
      }
    ]
  })
})

test('with realistic configurations', () => {
  const result = mergeConfigs(mainConfig, lendersApiConfig, 'lenders-api')
  expect(result).toMatchObject({
    navigation: {
      tabs: [
        {
          tab: 'Home',
          groups: [
            {
              group: 'Overview',
              pages: ['docs/getting_started']
            }
          ]
        },
        {
          tab: 'Introduction',
          groups: [
            {
              group: 'Documentation',
              pages: ['docs/lenders-api/api-reference/resources']
            }
          ]
        },
        {
          tab: 'API Reference',
          groups: [
            {
              group: 'Getting Started',
              pages: ['docs/lenders-api/api-reference/getting_started']
            },
            {
              group: 'Endpoint Examples',
              pages: [
                'docs/lenders-api/api-reference/endpoint/get_auth_token',
                'docs/lenders-api/api-reference/endpoint/submit_loan_application',
                'docs/lenders-api/api-reference/endpoint/shop_loan_application',
                'docs/lenders-api/api-reference/endpoint/get_shopped_loan_application',
                'docs/lenders-api/api-reference/endpoint/post_consent',
                'docs/lenders-api/api-reference/endpoint/schedule_call',
                'docs/lenders-api/api-reference/endpoint/call_me_now'
              ]
            },
            {
              group: 'Changelog',
              pages: ['docs/lenders-api/api-reference/changelog']
            }
          ]
        }
      ]
    }
  })
})
