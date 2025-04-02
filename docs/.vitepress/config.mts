import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: 'Fluxus',
  description:
    'A functional, reactive state management library for TypeScript inspired by Riverpod.',

  // https://vitepress.dev/reference/default-theme-config
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' }, // Placeholder
      { text: 'API', link: '/api/' }, // Placeholder for API docs
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Fluxus?', link: '/guide/introduction' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Comparison with Riverpod', link: '/guide/comparison-riverpod' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Providers', link: '/guide/providers' },
            { text: 'Scope', link: '/guide/scope' },
            { text: 'Reactivity', link: '/guide/reactivity' },
            { text: 'Lifecycle', link: '/guide/lifecycle' },
            { text: 'Async Operations', link: '/guide/async-provider' },
            { text: 'Stream Operations', link: '/guide/stream-provider' },
            { text: 'Combining Providers', link: '/guide/combining-providers' },
          ],
        },
        {
          text: 'React Adapter',
          items: [
            { text: 'Setup', link: '/guide/react/setup' },
            { text: 'useProvider', link: '/guide/react/use-provider' },
            { text: 'useProviderUpdater', link: '/guide/react/use-provider-updater' },
            {
              text: 'Advanced',
              items: [{ text: 'Provider Overrides', link: '/guide/provider-overrides' }],
            },
          ],
        },
        // Add more sections as needed
      ],
      '/project-context/': [
        {
          text: 'Project Context',
          items: [
            { text: 'Project Brief', link: '/project-context/projectbrief' },
            { text: 'Product Context', link: '/project-context/productContext' },
            { text: 'System Patterns', link: '/project-context/systemPatterns' },
            { text: 'Tech Context', link: '/project-context/techContext' },
          ],
        },
      ],
      // Placeholder for API sidebar
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' }, // Links to our placeholder index
            { text: 'API Index', link: '/api/generated/' }, // Links to generated README
            // Add links to specific important items as needed, e.g.:
            { text: 'Core: stateProvider', link: '/api/generated/src/functions/stateProvider' },
            {
              text: 'Core: computedProvider',
              link: '/api/generated/src/functions/computedProvider',
            },
            { text: 'Core: Scope', link: '/api/generated/src/classes/Scope' },
            {
              text: 'React: ProviderScope',
              link: '/api/generated/react-adapter/functions/ProviderScope',
            },
            {
              text: 'React: useProvider',
              link: '/api/generated/react-adapter/functions/useProvider',
            },
            {
              text: 'React: useProviderUpdater',
              link: '/api/generated/react-adapter/functions/useProviderUpdater',
            },
          ],
        },
      ],
    },

    socialLinks: [
      // Add link to GitHub repo later
      // { icon: 'github', link: 'https://github.com/your-repo' }
    ],

    footer: {
      message: 'Released under the ISC License.',
      copyright: `Copyright © ${new Date().getFullYear()} - Present`,
    },
  },

  // Base directory for GitHub Pages deployment
  base: '/fluxus/', // Set for github.io/fluxus/ deployment

  // Directory where built files will go
  outDir: '../dist-docs', // Place built docs outside the source 'docs' folder
});
