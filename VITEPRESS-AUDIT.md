# VitePress audit: vuewiki.dev vs Vue ecosystem conventions

Analysis of 9 VitePress sites from the Vue ecosystem: Pinia, Vue Router, Pinia Colada, Vite, VitePress, Vitest, VueUse, Vue I18n, Vue Macros. All configs read from cloned repos (June 2026).

## Current state of vuewiki.dev

```ts
// docs/.vitepress/config.ts
export default defineConfig({
  title: 'VueWiki.dev',
  description: 'Vue.js interview questions with answers and examples',
  cleanUrls: true,
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  locales: { root: { label: 'English', lang: 'en' }, es: { label: 'Español', lang: 'es' } },
  themeConfig: {
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: '...' }],
    nav: [],      // EMPTY
    sidebar: {},  // EMPTY
    // NO footer
    // NO editLink
    // NO sitemap
    // NO OG meta tags
  },
})
```

Homepage uses `layout: page` with a custom `<HomePage />` component instead of VitePress native `layout: home` with `hero` + `features`.

---

## 1. Navbar

Every single Vue ecosystem site has navbar items. None are empty.

| Project | Nav items |
|---------|-----------|
| Pinia | Guide, API, Cookbook, Links dropdown, v3.x dropdown |
| Vue Router | Guide, API, v4.x/v5.x dropdown, Links dropdown |
| Pinia Colada | Guide, API, Cookbook, Links dropdown |
| Vite | Guide, Config, Plugins, Blog, Resources dropdown, v7.x dropdown |
| VitePress | Guide, Reference, 2.0.0 dropdown |
| Vitest | Guides, API, Config, Blog, vX.x dropdown |
| VueUse | Guide dropdown, Functions dropdown, Resources dropdown, Playground |
| Vue Macros | Guide, Macros, Features, Volar, Example |
| Vue I18n | Guide, API, Ecosystem |

Common pattern: 2-4 main items + a "Links" or version dropdown. Libraries use Guide/API/Cookbook. Tools add Config. All use `activeMatch` for highlighting.

### What vuewiki.dev should do

Not a library, so Guide/API/Cookbook doesn't fit. Possible structure:

```ts
nav: [
  { text: 'Questions', link: '/', activeMatch: '^/$' },
  { text: 'Contributing', link: '/contributing' },
  {
    text: 'Links',
    items: [
      { text: 'GitHub', link: 'https://github.com/miguelfernandezdev/vuewiki.dev' },
      { text: 'Changelog', link: 'https://github.com/miguelfernandezdev/vuewiki.dev/blob/main/CHANGELOG.md' },
    ],
  },
]
```

---

## 2. Footer

Every site uses the same two-field pattern:

```ts
footer: {
  message: 'Released under the MIT License.',
  copyright: 'Copyright © 2026-present Miguel Fernández',
}
```

Vitest/Vite use a richer footer with nav columns (`title` + `items` arrays) and social icons, but they use the `@voidzero-dev/vitepress-theme` custom theme. The standard two-line footer is the default convention.

### What vuewiki.dev should do

Add the standard footer. The locale keys `footer.builtWith` and `footer.github` already exist in en.json/es.json but are unused (dead code). Either use them in a custom footer component or remove them and use the native VitePress footer.

---

## 3. Edit link

Every site enables it. Two text conventions:

| Text | Used by |
|------|---------|
| "Suggest changes to this page" | Pinia, Vue Router, Pinia Colada, VueUse, Vitest |
| "Suggest changes" | Pinia (shared config) |
| "Edit this page on GitHub" | VitePress |

```ts
editLink: {
  pattern: 'https://github.com/miguelfernandezdev/vuewiki.dev/edit/main/docs/:path',
  text: 'Suggest changes to this page',
}
```

---

## 4. Social links

| Project | GitHub | X/Twitter | Bluesky | Discord | Mastodon |
|---------|--------|-----------|---------|---------|----------|
| Pinia | x | x | | x | |
| Vue Router | x | x | | x | |
| Pinia Colada | x | x | | x | |
| Vite | x | x | x | x | x |
| VitePress | x | | | | |
| Vitest | x | | x | x | x |
| VueUse | x | | x | x | |
| Vue I18n | | | | | |
| Vue Macros | | | | | |

GitHub is universal. Most include at least one other social platform.

### What vuewiki.dev should do

Keep GitHub. Add X/Twitter or Bluesky if there's a relevant account. Discord only if there's a community server.

---

## 5. OG meta tags (social sharing)

Every site sets at minimum: `og:type`, `og:title`, `og:description`, `og:image`, `twitter:card`.

Common pattern in head config:

```ts
head: [
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:title', content: 'VueWiki.dev' }],
  ['meta', { property: 'og:description', content: 'Vue.js interview questions with answers and examples' }],
  ['meta', { property: 'og:image', content: 'https://vuewiki.dev/og-image.png' }],
  ['meta', { property: 'og:url', content: 'https://vuewiki.dev' }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ['meta', { name: 'twitter:title', content: 'VueWiki.dev' }],
  ['meta', { name: 'twitter:description', content: 'Vue.js interview questions with answers and examples' }],
]
```

Requires creating an OG image (1280x640 is the standard Pinia/Vite use).

### What vuewiki.dev should do

Add OG meta tags. Create an og-image.png for the `public/` directory.

---

## 6. Sitemap

| Project | Has sitemap |
|---------|------------|
| Vue Router | `hostname: 'https://router.vuejs.org'` |
| VitePress | `hostname: 'https://vitepress.dev'` + filter migration pages |
| Vite | `hostname: 'https://vite.dev'` |
| Vue Macros | `hostname: docsLink` |
| Pinia | Not configured |
| Pinia Colada | Not configured |
| Vitest | Not configured (uses PWA) |
| VueUse | Not configured (uses PWA) |

```ts
sitemap: {
  hostname: 'https://vuewiki.dev',
}
```

Free SEO win, one line of config.

---

## 7. lastUpdated

| Project | Enabled |
|---------|---------|
| VitePress | `lastUpdated: true` |
| Vitest | `lastUpdated: true` |
| Vue Macros | `lastUpdated: true` |
| Others | Not enabled |

Optional. Adds credibility but requires git history to be available at build time.

---

## 8. Homepage

Every site uses VitePress native `layout: home` with frontmatter hero + features. Example (Pinia):

```yaml
---
layout: home
title: Pinia
titleTemplate: The intuitive store for Vue.js

hero:
  name: Pinia
  text: The intuitive store for Vue.js
  tagline: Type Safe, Extensible, and Modular by design.
  image:
    src: /logo.svg
    alt: Pinia
  actions:
    - theme: brand
      text: Get Started
      link: /introduction
    - theme: alt
      text: Demo
      link: https://stackblitz.com/...

features:
  - title: 💡 Intuitive
    details: Stores are as familiar as components.
  - title: 🔑 Type Safe
    details: Types are inferred, autocompletion even in JavaScript!
---
```

Most then include a custom sponsors component below the frontmatter.

### What vuewiki.dev should do

The custom HomePage with search, difficulty filters, and tag filters is a differentiator. Options:

**Option A**: Keep custom homepage as-is. It works, it's useful, it's unique.

**Option B**: Use native `layout: home` for the hero section (title, tagline, CTA buttons) and render the custom question browser below it. This gives the VitePress-native feel on first load while keeping the filtering functionality.

**Option C**: Replace custom homepage entirely with native layout + sidebar navigation for browsing questions. This is the most "VitePress-like" but loses the search/filter UX.

Option B is probably the sweet spot.

---

## 9. Sidebar

Every library site groups content into collapsible sections:

```ts
sidebar: {
  '/': [
    {
      text: 'Introduction',
      items: [
        { text: 'What is Pinia?', link: '/introduction' },
        { text: 'Getting Started', link: '/getting-started' },
      ],
    },
    {
      text: 'Core Concepts',
      collapsed: false,
      items: [
        { text: 'Defining a Store', link: '/core-concepts/' },
        { text: 'State', link: '/core-concepts/state' },
      ],
    },
  ],
}
```

Pattern: separate sidebar configs per path prefix (`'/api/'`, `'/guide/'`, `'/'` catch-all).

### What vuewiki.dev should do

Group 170 questions by tag/category in the sidebar. Since each question has tags, group by primary tag:

```ts
sidebar: {
  '/q/': [
    {
      text: 'Core (5)',
      collapsed: true,
      items: [/* questions tagged "core" */],
    },
    {
      text: 'Reactivity (15)',
      collapsed: true,
      items: [/* questions tagged "reactivity" */],
    },
    // ...
  ],
}
```

This could be generated from the questions.data.ts loader. With 170 questions, collapsed groups are mandatory.

Consider: should the sidebar replace the homepage filter, complement it, or only appear on question detail pages? The homepage filter is more powerful (multi-tag, search, difficulty). The sidebar is better for sequential browsing and "where am I" context.

Recommendation: show sidebar on question detail pages only. Homepage keeps its custom filter UI.

---

## 10. Search configuration

| Project | Provider | Details |
|---------|----------|---------|
| Pinia | Algolia | With localized search |
| Vue Router | Algolia | With localized search |
| VitePress | Algolia | With AI assistant (`askAi`) |
| VueUse | Algolia | |
| Pinia Colada | Local | With `detailedView` and `boostDocument` for guide over API |
| Vitest | Local | |
| Vite | Local | |
| Vue Macros | Local | With Chinese translations |
| vuewiki.dev | Local | Basic config |

Local search is fine for our size. Could add `detailedView: true` and boost question pages.

---

## 11. Analytics

Fathom Analytics is used by 6/9 projects. It's the de facto standard in the Vue ecosystem:

```ts
['script', {
  src: 'https://cdn.usefathom.com/script.js',
  'data-site': 'SITE_ID',
  'data-spa': 'auto',
  defer: '',
}]
```

### What vuewiki.dev should do

Optional. Adds page view tracking without cookie banners (privacy-friendly).

---

## 12. LLMs.txt plugin

Growing convention. Used by Vue Router, Pinia Colada, VitePress, Vitest, Vite via `vitepress-plugin-llms`:

```ts
import llmstxt from 'vitepress-plugin-llms'
// in vite.plugins:
llmstxt({
  description: '...',
  details: '...',
  ignoreFiles: ['index.md', 'api/**/*'],
})
```

Generates `/llms.txt` and `/llms-full.txt` for AI-friendly documentation.

### What vuewiki.dev should do

Low effort, high future value. Makes the wiki consumable by AI tools.

---

## 13. Theme customization

| Project | Custom theme | What they customize |
|---------|-------------|-------------------|
| Pinia | Yes | HomeSponsors component, home-links CSS, sponsor styles |
| Vue Router | Yes | HomeSponsors component, home-links CSS |
| Pinia Colada | Yes | HomeSponsors, MasteringPinia sidebar widget |
| Vite | Yes | Full landing page, custom components, landing layout |
| VitePress | Minimal | Just styles.css |
| Vitest | Yes | Custom Hero, Home, FeatureGrid, Intro components |
| VueUse | Yes | Many custom components (FunctionsList, Contributors, etc.) |
| Vue I18n | Yes | Sponsors, integrations components |
| Vue Macros | Yes | Custom Layout.vue |

Common: extend DefaultTheme, register custom components, add CSS overrides.

### What vuewiki.dev already has

- `HomePage.vue` (324 lines, custom search/filter/card browser)
- `QuestionMeta.vue` (109 lines, difficulty badge + tags on detail pages)
- `style.css` (Vue green brand colors, hidden h1)
- `i18n.ts` (custom composable)
- `questions.data.ts` (content loader)

This is solid. No changes needed to the theme architecture.

---

## 14. Markdown code themes

| Project | Dark | Light |
|---------|------|-------|
| Pinia | dracula-soft | vitesse-light |
| Vue Router | one-dark-pro | github-light |
| Pinia Colada | dracula-soft | vitesse-light |
| VueUse | vitesse-dark | vitesse-light |
| Vitest | github-dark | github-light |
| vuewiki.dev | (VitePress default) | (VitePress default) |

Could set an explicit theme. `github-dark` / `github-light` is the most neutral choice.

---

## 15. Bugs found in vuewiki.dev

### Missing tag translations

The questions use 26 unique tags but en.json/es.json only define 24. Missing:

- `debugging` (shows as "tags.debugging" on the site)
- `security` (shows as "tags.security" on the site)

Fix: add to both locale files:
```json
"debugging": "Debugging",
"security": "Security"
```

### Dead locale keys

`footer.builtWith` and `footer.github` exist in locale files but no component renders them.

---

## Priority implementation order

1. **Bugs first**: fix missing tag translations (debugging, security)
2. **Config quick wins**: footer, editLink, sitemap, OG meta tags (all just config changes)
3. **Navbar**: add nav items (Questions, Contributing, Links)
4. **Sidebar**: generate from question data, show on detail pages
5. **Homepage**: consider Option B (native hero + custom browser below)
6. **Polish**: code theme, lastUpdated, llms.txt plugin, analytics
7. **Nice to have**: OG image design, additional social links
