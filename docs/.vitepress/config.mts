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
            { text: 'Comparison with Riverpod', link: '/guide/comparison-riverpod' },
          ],
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
        {
          text: 'Vue Adapter',
          items: [{ text: 'Usage Guide', link: '/guide/vue' }],
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
      '/api/': [
        { text: 'Overview', link: '/api/' }, // Keep the main overview link
        {
          text: 'Core API',
          items: [
            { text: 'Index', link: '/api/generated/src/' }, // Link to src/README.md
            {
              text: 'Classes',
              collapsed: true, // Keep sections collapsed initially
              items: [{ text: 'Scope', link: '/api/generated/src/classes/Scope' }],
            },
            {
              text: 'Functions',
              collapsed: true,
              items: [
                { text: 'computedProvider', link: '/api/generated/src/functions/computedProvider' },
                { text: 'createScope', link: '/api/generated/src/functions/createScope' },
                {
                  text: 'isComputedProviderInstance',
                  link: '/api/generated/src/functions/isComputedProviderInstance',
                },
                { text: 'isProvider', link: '/api/generated/src/functions/isProvider' },
                {
                  text: 'isStateProviderInstance',
                  link: '/api/generated/src/functions/isStateProviderInstance',
                },
                { text: 'stateProvider', link: '/api/generated/src/functions/stateProvider' },
              ],
            },
            {
              text: 'Interfaces',
              collapsed: true,
              items: [
                {
                  text: 'ComputedProviderInstance',
                  link: '/api/generated/src/interfaces/ComputedProviderInstance',
                },
                { text: 'Disposable', link: '/api/generated/src/interfaces/Disposable' },
                { text: 'ScopeReader', link: '/api/generated/src/interfaces/ScopeReader' },
                {
                  text: 'StateProviderInstance',
                  link: '/api/generated/src/interfaces/StateProviderInstance',
                },
              ],
            },
            {
              text: 'Type Aliases',
              collapsed: true,
              items: [
                { text: 'Dispose', link: '/api/generated/src/type-aliases/Dispose' },
                { text: 'Provider', link: '/api/generated/src/type-aliases/Provider' },
                { text: 'StateUpdater', link: '/api/generated/src/type-aliases/StateUpdater' },
              ],
            },
          ],
        },
        {
          text: 'React Adapter',
          items: [
            { text: 'Index', link: '/api/generated/react-adapter/' }, // Link to react-adapter/README.md
            {
              text: 'Functions',
              collapsed: true,
              items: [
                {
                  text: 'ProviderScope',
                  link: '/api/generated/react-adapter/functions/ProviderScope',
                },
                { text: 'useProvider', link: '/api/generated/react-adapter/functions/useProvider' },
                {
                  text: 'useProviderUpdater',
                  link: '/api/generated/react-adapter/functions/useProviderUpdater',
                },
                { text: 'useScope', link: '/api/generated/react-adapter/functions/useScope' },
              ],
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
