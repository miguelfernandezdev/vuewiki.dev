---
order: 5
title: "How do you create a Vue project from scratch?"
difficulty: "beginner"
tags: ["tooling", "pinia", "vite", "vitest"]
summary: "Run npm create vue@latest to scaffold a Vite-powered project with optional TypeScript, Router, Pinia, Vitest, and ESLint."
---

The official way to start a new Vue project is `create-vue`, which scaffolds a Vite-powered project with optional TypeScript, Router, Pinia, Vitest, and ESLint.

## Using create-vue

```bash
npm create vue@latest
```

The interactive prompt asks what you need:

```
✔ Project name: my-app
✔ Add TypeScript? Yes
✔ Add JSX Support? No
✔ Add Vue Router? Yes
✔ Add Pinia? Yes
✔ Add Vitest for Unit Testing? Yes
✔ Add an End-to-End Testing Solution? No
✔ Add ESLint for code quality? Yes
✔ Add Prettier for code formatting? Yes
```

Then install and run:

```bash
cd my-app
npm install
npm run dev
```

## What the scaffold gives you

```
my-app/
├── index.html            ← entry HTML (Vite uses this as the entry point)
├── vite.config.ts        ← Vite + Vue plugin config
├── tsconfig.json
├── src/
│   ├── main.ts           ← creates the app, mounts it
│   ├── App.vue           ← root component
│   ├── components/
│   ├── views/            ← (if Router selected)
│   ├── stores/           ← (if Pinia selected)
│   └── router/           ← (if Router selected)
├── public/               ← static assets (copied as-is)
└── package.json
```

## The entry point

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.mount('#app')
```

`createApp` creates the application instance. Plugins are added with `.use()`. `.mount('#app')` attaches it to the DOM element in `index.html`.

## Why Vite and not Webpack

Vue CLI (based on Webpack) is in maintenance mode. Vite is the recommended build tool for new Vue projects:

| | Vite | Webpack (Vue CLI) |
|---|---|---|
| Dev server startup | Instant (native ES modules) | Slow (bundles everything first) |
| Hot Module Replacement | Fast (only updates changed module) | Slower (rebundles dependency graph) |
| Build tool | Rollup (production) | Webpack |
| Config | Minimal by default | Verbose |
| Status | Actively developed | Maintenance mode |

## Minimal manual setup

If you want to understand what `create-vue` does, here's the minimum:

```bash
npm init -y
npm install vue
npm install -D vite @vitejs/plugin-vue
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
```

That's four files. Everything else (`create-vue` adds) is optional tooling on top.

See also: [What is Vite?](/q/what-is-vite) · [How would you structure a large Vue project?](/q/large-project-structure) · [How do Vue DevTools help with debugging?](/q/vue-devtools)

## References

- [Quick Start](https://vuejs.org/guide/quick-start.html) - Vue.js docs
- [Getting Started](https://vite.dev/guide/) - Vite docs
- [create-vue](https://github.com/vuejs/create-vue) - GitHub
