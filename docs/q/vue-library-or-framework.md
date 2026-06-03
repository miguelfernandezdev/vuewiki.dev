---
order: 3
title: "Is Vue a library or a framework? Why?"
difficulty: "beginner"
tags: ["core", "pinia", "vite"]
summary: "Vue is a progressive framework. The core is a view library, but its official ecosystem (Router, Pinia, Vite) gives it full framework capabilities."
---

Vue is officially described as a "[progressive framework](https://vuejs.org/guide/introduction.html)." The core package (`vue`) is a view library focused on rendering UI, comparable in scope to React. But unlike a pure library, Vue ships an official ecosystem ([Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/), [Vite](https://vite.dev/) scaffolding, [DevTools](https://devtools.vuejs.org/), SSR) that gives it framework-level capabilities. You start with just the view layer and adopt more pieces as your project needs them.

## The distinction

A **library** provides tools you call when you need them. You control the flow. jQuery and Lodash are libraries: you call `$.ajax()` or `_.debounce()` in your own code structure.

A **framework** controls the flow and calls your code. You fill in the blanks. Angular and Nuxt are frameworks: they dictate the project structure, the build pipeline, the routing convention.

Vue sits between the two depending on how much of its ecosystem you use.

## Vue as a library

If you only use the core package, Vue behaves like a library:

```html
<div id="app"></div>

<script type="module">
import { createApp, ref } from 'vue'

const App = {
  setup() {
    const count = ref(0)
    return { count }
  },
  template: `<button @click="count++">{{ count }}</button>`
}

createApp(App).mount('#app')
</script>
```

You decide the project structure, the build tool, the routing solution, the state management. Vue handles rendering and reactivity. Nothing else.

## Vue as a framework

When you use the full ecosystem, Vue becomes a framework:

```
my-app/
├── src/
│   ├── router/          # Vue Router
│   ├── stores/          # Pinia
│   ├── views/           # Page components
│   ├── components/      # Reusable UI
│   ├── composables/     # Shared logic
│   └── App.vue
├── vite.config.ts       # Vite (official build tool)
└── package.json
```

[`create-vue`](https://github.com/vuejs/create-vue) scaffolds this structure. Vue Router handles navigation. Pinia manages state. Vite runs the dev server and production build. The ecosystem dictates conventions, which makes it a framework in practice.

## Nuxt makes it even clearer

Nuxt is unambiguously a framework built on Vue. It controls routing (file-based), server rendering, data fetching, middleware, and project structure. You write components and pages; Nuxt decides when and how they run.

```
my-nuxt-app/
├── pages/          # File-based routing (Nuxt convention)
├── server/         # API routes (Nuxt convention)
├── composables/    # Auto-imported (Nuxt convention)
└── nuxt.config.ts  # Nuxt controls the build
```

## The "progressive" part

Vue's official tagline is "the progressive framework" because you can scale adoption incrementally:

1. **Drop-in script**: Add Vue to a single page for one interactive widget
2. **SPA with Vite**: Full client-side app with components and reactivity
3. **SPA with routing and state**: Add Vue Router and Pinia
4. **SSR/SSG**: Add Nuxt for server rendering and file-based routing

At step 1, Vue is a library. By step 4, it's a full framework. You move along that spectrum based on project needs, without switching technologies.

## Comparison with React and Angular

| | Vue | React | Angular |
|---|---|---|---|
| Core | View layer (reactivity + rendering) | View layer (rendering) | Full framework |
| Routing | Official (Vue Router) but optional | Third-party (React Router) | Built-in (@angular/router) |
| State management | Official (Pinia) but optional | Third-party (Redux, Zustand) | Built-in (Services + RxJS) |
| Build tool | Official (Vite) but optional | Third-party (Vite, Webpack) | Built-in (Angular CLI) |
| Project structure | Suggested, not enforced | No convention | Enforced by CLI |
| Classification | Progressive framework | Library | Framework |

React calls itself a library because it only handles rendering. Angular calls itself a framework because it includes everything. Vue starts as a library and becomes a framework as you add its official ecosystem.

See also: [What is Vue and what are its main features?](/q/what-is-vue)

## References

- [Introduction](https://vuejs.org/guide/introduction.html) - Vue.js docs
- [Quick Start](https://vuejs.org/guide/quick-start.html) - Vue.js docs
- [Tooling](https://vuejs.org/guide/scaling-up/tooling.html) - Vue.js docs
