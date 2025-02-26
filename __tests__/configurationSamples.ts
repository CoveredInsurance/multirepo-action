export const mainConfig = {
  $schema: 'https://mintlify.com/docs.json',
  theme: 'mint',
  name: 'Starter Kit',
  colors: {
    primary: '#00e3a5',
    light: '#00e3a5',
    dark: '#00e3a5'
  },
  favicon: '/docs/logo/favicon_new_c.svg',
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
      }
    ]
  },
  logo: {
    light: '/docs/logo/favicon_new_c.svg',
    dark: '/docs/logo/favicon_new_c.svg'
  },
  background: {
    color: {
      light: '#f9f9f9',
      dark: '#201b4f'
    }
  },
  navbar: {
    links: [
      {
        label: 'Support',
        href: 'mailto:developers@itscovered.com'
      }
    ]
  }
}
export const lendersApiConfig = {
  $schema: 'https://mintlify.com/docs.json',
  theme: 'mint',
  name: 'Starter Kit',
  colors: {
    primary: '#00e3a5',
    light: '#00e3a5',
    dark: '#00e3a5'
  },
  favicon: '/docs/logo/favicon_new_c.svg',
  navigation: {
    tabs: [
      {
        tab: 'Introduction',
        groups: [
          {
            group: 'Documentation',
            pages: ['docs/api-reference/resources']
          }
        ]
      },
      {
        tab: 'API Reference',
        groups: [
          {
            group: 'Getting Started',
            pages: ['docs/api-reference/getting_started']
          },
          {
            group: 'Endpoint Examples',
            pages: [
              'docs/api-reference/endpoint/get_auth_token',
              'docs/api-reference/endpoint/submit_loan_application',
              'docs/api-reference/endpoint/shop_loan_application',
              'docs/api-reference/endpoint/get_shopped_loan_application',
              'docs/api-reference/endpoint/post_consent',
              'docs/api-reference/endpoint/schedule_call',
              'docs/api-reference/endpoint/call_me_now'
            ]
          },
          {
            group: 'Changelog',
            pages: ['docs/api-reference/changelog']
          }
        ]
      }
    ]
  },
  logo: {
    light: '/docs/logo/favicon_new_c.svg',
    dark: '/docs/logo/favicon_new_c.svg'
  },
  background: {
    color: {
      light: '#f9f9f9',
      dark: '#201b4f'
    }
  },
  navbar: {
    links: [
      {
        label: 'Support',
        href: 'mailto:developers@itscovered.com'
      }
    ]
  }
}
