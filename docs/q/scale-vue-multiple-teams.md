---
order: 162
title: "How do you architect a Vue 3 app to scale across multiple teams?"
difficulty: "advanced"
tags: ["architecture"]
---

Organize code by business domain, not by technical layer. Each team owns a vertical slice of the application (a feature module) with its own components, composables, stores, and routes. Shared code goes in a separate package with strict API boundaries. The goal is that teams can ship independently without stepping on each other's code.

## Feature-based directory structure

Instead of grouping by type (all components together, all stores together), group by domain:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/
│   │   ├── routes.ts
│   │   └── index.ts          ← public API
│   ├── billing/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/
│   │   ├── routes.ts
│   │   └── index.ts
│   └── dashboard/
│       ├── components/
│       ├── composables/
│       ├── stores/
│       ├── routes.ts
│       └── index.ts
├── shared/
│   ├── components/            ← design system
│   ├── composables/           ← cross-cutting utilities
│   ├── types/
│   └── index.ts
├── app/
│   ├── App.vue
│   ├── router.ts             ← assembles feature routes
│   └── main.ts
```

Each feature's `index.ts` exports only what other features are allowed to import. Internal components and helpers stay private.

## Module boundaries with barrel exports

```ts
// features/auth/index.ts — public API
export { useAuth } from './composables/useAuth'
export { LoginPage } from './components/LoginPage.vue'
export { authRoutes } from './routes'
export type { User, AuthState } from './types'

// Everything else in auth/ is internal
```

Enforce this with ESLint rules that restrict deep imports:

```js
// eslint.config.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/features/*/components/*', '@/features/*/composables/*', '@/features/*/stores/*'],
          message: 'Import from the feature barrel (index.ts), not from internal files.'
        }
      ]
    }]
  }
}
```

## Route composition

Each feature defines its own routes. The app router assembles them:

```ts
// features/billing/routes.ts
export const billingRoutes: RouteRecordRaw[] = [
  {
    path: '/billing',
    component: () => import('./components/BillingLayout.vue'),
    children: [
      { path: '', component: () => import('./components/BillingDashboard.vue') },
      { path: 'invoices', component: () => import('./components/Invoices.vue') }
    ]
  }
]
```

```ts
// app/router.ts
import { authRoutes } from '@/features/auth'
import { billingRoutes } from '@/features/billing'
import { dashboardRoutes } from '@/features/dashboard'

const router = createRouter({
  routes: [
    ...authRoutes,
    ...billingRoutes,
    ...dashboardRoutes
  ]
})
```

Teams add routes to their own feature without touching the global router file.

## Shared state across features

Features should avoid importing each other's stores directly. When two features need to share data, use one of these patterns:

```ts
// shared/composables/useCurrentUser.ts
// Thin interface that auth owns, others consume
const currentUser = ref<User | null>(null)

export function useCurrentUser() {
  return { user: readonly(currentUser) }
}

export function setCurrentUser(user: User | null) {
  currentUser.value = user
}
```

The auth feature calls `setCurrentUser` after login. Other features call `useCurrentUser()` to read. The shared composable is the contract between them.

## Monorepo for larger organizations

When teams are fully independent, move features into packages:

```
packages/
├── auth/          ← Team Alpha
├── billing/       ← Team Beta
├── dashboard/     ← Team Gamma
├── ui/            ← Design system team
└── app/           ← Shell team (assembles everything)
```

Each package has its own `package.json`, tests, and build pipeline. The `app` package imports the others as dependencies. This is where tools like pnpm workspaces, Turborepo, or Nx come in.

## Key principles

| Principle | Why |
|---|---|
| Feature modules over technical layers | Teams own verticals, not horizontals |
| Barrel exports as public API | Prevents coupling to internal structure |
| Shared code is explicit and versioned | Changes to shared code are visible to all consumers |
| Features don't import each other's internals | Use shared contracts (composables, types, events) |
| Lazy-loaded routes per feature | Each feature is a separate chunk, reducing initial load |
| Lint rules enforce boundaries | Humans forget, linters don't |
