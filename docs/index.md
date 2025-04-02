---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
hero:
  name: 'Fluxus'
  text: 'Modern State Management'
  tagline: Inspired by Riverpod, built for TypeScript. Functional, reactive, and boilerplate-free.
  image:
    # Add a logo path here later if you have one
    # src: /logo.png
    # alt: Fluxus Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction # Link to introduction or getting started guide
    - theme: alt
      text: View on GitHub
      link: https://github.com/shtse8/fluxus # Link to your repo
features:
  - title: Zero Boilerplate Setup
    icon: ✨
    details: Use providers directly without pre-registration. Just import and use. Perfect tree-shaking out-of-the-box.
  - title: Functional & Composable
    icon: 🔀
    details: Built with functional programming principles. Compose providers and logic with ease.
  - title: Fine-Grained Reactivity
    icon: ⚡️
    details: Automatic dependency tracking ensures only necessary components update, minimizing re-renders.
  - title: Type-Safe by Design
    icon: 🔒
    details: Leverage the full power of TypeScript for end-to-end type safety and excellent autocompletion.
  - title: Framework Agnostic Core
    icon: 🧩
    details: Solid core library with dedicated adapters for UI frameworks like React (more coming soon!).
  - title: Robust Lifecycle Management
    icon: ♻️
    details: Automatic cleanup and disposal of state when it's no longer needed, preventing memory leaks.
---

<!-- You can optionally add more Markdown content below the features if needed -->
