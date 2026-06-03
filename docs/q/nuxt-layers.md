---
order: 162
title: "What are Nuxt layers and when would you use them?"
difficulty: "advanced"
tags: ["nuxt", "architecture"]
summary: "Layers are partial Nuxt apps you extend via config. They share components, composables, pages, and config across projects."
---

Layers let you share partial Nuxt applications across projects. A layer can include components, composables, pages, layouts, middleware, plugins, server routes, and config. Think of them as Nuxt's inheritance model: your project extends one or more layers, and everything merges automatically.

## Using a layer

Add it to `extends` in your config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [
    '@my-org/base-layer',          // from npm
    '../shared-layer',              // local directory
    'github:user/repo#main',       // from git
  ]
})
```

Everything the layer provides (components, composables, pages, etc.) becomes available in your project with no additional configuration.

## Creating a layer

A layer is a minimal Nuxt project with a `nuxt.config.ts`:

```
my-layer/
├── nuxt.config.ts
├── components/
│   ├── BaseButton.vue
│   └── BaseCard.vue
├── composables/
│   └── useTheme.ts
├── layouts/
│   └── default.vue
├── server/
│   └── api/
│       └── health.get.ts
└── package.json
```

```ts
// my-layer/nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
})
```

The consuming project gets all components, composables, layouts, and server routes from the layer, plus any modules it declares.

## Overriding layer files

Your project always wins over the layer. If the layer provides `components/BaseButton.vue` and you create the same file, your version takes precedence.

Priority order (highest to lowest):
1. Your project files
2. Auto-scanned layers from `~~/layers` directory (sorted alphabetically, Z has higher priority than A)
3. Layers in `extends` (first entry wins over later ones)

## Auto-scanned layers

Place layers in a `layers/` directory and Nuxt discovers them automatically:

```
my-app/
├── layers/
│   ├── base/
│   │   ├── nuxt.config.ts
│   │   └── components/
│   └── theme/
│       ├── nuxt.config.ts
│       └── composables/
├── nuxt.config.ts
└── pages/
```

No `extends` config needed for these.

## Practical example: theme layer

A reusable theme shared across multiple apps:

```ts
// theme-layer/app.config.ts
export default defineAppConfig({
  theme: {
    primaryColor: '#00dc82',
    darkMode: false
  }
})
```

```ts
// theme-layer/composables/useTheme.ts
export function useTheme() {
  const config = useAppConfig()
  const isDark = useState('dark', () => config.theme.darkMode)
  const toggle = () => isDark.value = !isDark.value
  return { isDark, toggle }
}
```

The consuming app overrides only what it needs:

```ts
// my-app/app.config.ts
export default defineAppConfig({
  theme: {
    primaryColor: '#ff6347' // override, darkMode stays false
  }
})
```

## Publishing as an npm package

```json
{
  "name": "@my-org/base-layer",
  "version": "1.0.0",
  "type": "module",
  "main": "./nuxt.config.ts",
  "dependencies": {
    "@nuxt/ui": "^3.0.0"
  }
}
```

Then any project can `npm install @my-org/base-layer` and extend it.

## Scaffolding a new layer

```bash
npx nuxi init --template layer my-layer
```

## Layers vs modules

| | Layer | Module |
|---|---|---|
| What it is | A partial Nuxt app (files and config) | A build-time plugin (code that runs during build) |
| Can provide | Components, pages, layouts, composables, server routes, config | Anything via @nuxt/kit programmatic API |
| Merging | File-based, automatic | Programmatic, explicit |
| Override | Replace the file in your project | Configure via module options |
| Use when | Sharing a base app, design system, or preset across projects | Adding a capability (analytics, auth, image optimization) |

See also: [How do Nuxt modules work?](/q/nuxt-modules) · [What is the Nuxt directory structure?](/q/nuxt-directory-structure) · [How do you deploy a Nuxt app?](/q/nuxt-deployment)

## References

- [Layers](https://nuxt.com/docs/getting-started/layers) - Nuxt docs
- [Extending a Layer](https://nuxt.com/docs/guide/going-further/layers) - Nuxt docs
- [nuxt.config extends](https://nuxt.com/docs/api/nuxt-config#extends) - Nuxt docs
