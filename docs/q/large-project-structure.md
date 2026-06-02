---
order: 29
title: "How would you structure a large Vue project?"
difficulty: "advanced"
tags: ["architecture"]
---

Vue does not enforce any particular project structure. A brand-new Vite scaffold gives you a `src/` folder and leaves the rest to you. That works fine for a few dozen files, but as the codebase grows the absence of conventions becomes a real problem: no one can predict where a given piece of logic lives, reviews become harder, and onboarding new developers takes longer than it should. The goal of a deliberate structure is simple — any file should be findable by its responsibility, not by memory.

## Flat structure (small apps)

For most apps under a few hundred files, a single-level structure grouped by technical role is enough. Each folder has a single job:

```
src/
├── api/              # HTTP clients, service functions, response mappers
├── assets/           # Images, fonts, global CSS — anything that doesn't export logic
├── components/       # Reusable UI components (Button, Modal, DataTable)
├── composables/      # Reusable reactive logic (useAuth, usePagination)
├── router/           # Vue Router config and route guards
├── stores/           # Pinia stores — one file per domain (useCartStore, useUserStore)
├── types/            # Shared TypeScript interfaces and type aliases
├── utils/            # Pure helper functions (formatDate, slugify)
├── views/            # Page-level components mapped to routes
└── App.vue
```

The key discipline: **only shared, cross-cutting code lives here.** If a component is only used inside one view, it does not belong in `components/` — it belongs next to the view that owns it. Mixing shared and feature-specific code in the same flat folder is what causes `components/` to balloon to 80 files with no clear grouping.

## Feature-based structure (medium and large apps)

When a flat structure starts producing folders with more than 20 files, or when multiple developers are working in parallel on different parts of the app, grouping by feature (also called domain-driven or screaming architecture) is the better choice.

The idea is that the folder structure should tell you what the application **does**, not how it is technically implemented:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/     # LoginForm.vue, OAuthButton.vue
│   │   ├── composables/    # useSession.ts, usePermissions.ts
│   │   ├── stores/         # useAuthStore.ts
│   │   ├── types/          # AuthUser.ts, LoginPayload.ts
│   │   └── index.ts        # Public API — what other features can import
│   ├── catalog/
│   │   ├── components/     # ProductCard.vue, FilterPanel.vue
│   │   ├── composables/    # useProductSearch.ts, useFilters.ts
│   │   ├── stores/         # useCatalogStore.ts
│   │   ├── types/          # Product.ts, Category.ts
│   │   └── index.ts
│   └── checkout/
│       ├── components/     # CartSummary.vue, PaymentForm.vue
│       ├── composables/    # useCart.ts, useCheckout.ts
│       ├── stores/         # useCartStore.ts
│       ├── types/          # CartItem.ts, Order.ts
│       └── index.ts
├── shared/             # Code used by 2 or more features
│   ├── components/     # AppButton.vue, AppModal.vue, AppIcon.vue
│   ├── composables/    # useToast.ts, useMediaQuery.ts
│   ├── types/          # Pagination.ts, ApiResponse.ts
│   └── utils/          # formatDate.ts, slugify.ts
├── router/
├── assets/
└── App.vue
```

When does this make more sense than flat? When you have teams that own features end-to-end, when you want to make it easy to delete or extract a feature, or simply when the flat `components/` folder has grown too large to navigate.

## Shared vs feature code

The most common mistake in feature-based projects is letting shared utilities accumulate inside a single feature and then importing them from there. The rule is strict:

- Code used by **one feature only** lives inside that feature.
- Code used by **two or more features** moves to `shared/`.

```ts
// shared/composables/useToast.ts
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info') {
    toasts.value.push({ id: Date.now(), message, type })
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, show, dismiss }
}
```

Both `auth` and `checkout` can import `useToast` because it lives in `shared/`. Neither imports from the other feature directly.

## Barrel exports (feature public API)

Each feature folder exposes an `index.ts` file that defines exactly what the outside world is allowed to use. Everything else inside the feature is considered internal.

```ts
// features/auth/index.ts
export { default as LoginForm } from './components/LoginForm.vue'
export { default as OAuthButton } from './components/OAuthButton.vue'
export { useSession } from './composables/useSession'
export { useAuthStore } from './stores/useAuthStore'
export type { AuthUser } from './types/AuthUser'

// NOT exported: internal helpers, sub-components, raw API calls
```

Other features import from the barrel, never from internal paths:

```ts
// Good — importing from the feature's public API
import { useSession, type AuthUser } from '@/features/auth'

// Bad — reaching into internals, breaks the boundary
import { useSession } from '@/features/auth/composables/useSession'
```

This creates explicit contracts between features. When you refactor the internals of `auth`, nothing breaks in `checkout` as long as the `index.ts` exports stay stable.

## Naming conventions

| Type | Convention | Example |
| --- | --- | --- |
| Components | PascalCase, noun phrase | `ProductCard.vue`, `AppModal.vue` |
| Composables | camelCase, `use` prefix | `useCart.ts`, `useMediaQuery.ts` |
| Pinia stores | camelCase, `useXxxStore` | `useAuthStore.ts`, `useCartStore.ts` |
| Types / interfaces | PascalCase | `AuthUser.ts`, `CartItem.ts` |
| Utility functions | camelCase, verb | `formatDate.ts`, `slugify.ts` |
| Feature folders | kebab-case | `user-profile/`, `order-history/` |

These are not arbitrary style preferences. PascalCase for components distinguishes them from native HTML elements in templates. The `use` prefix for composables signals "this returns reactive state and side effects" to anyone reading the import. Consistency here removes a category of micro-decisions entirely.

## When to change structure

| Situation | Recommended structure |
| --- | --- |
| Small app, 1–2 developers, < 100 components | Flat (`src/components`, `src/composables`, etc.) |
| Medium app, 3–5 developers, domain-driven features | Feature-based (`src/features/xxx`) |
| Large app, multiple teams, shared design system | Feature-based + `shared/` + consider a monorepo |
| Multiple apps sharing UI components or business logic | Monorepo with packages (`packages/ui`, `packages/core`) |

The mistake teams make is jumping straight to the most complex structure before the complexity exists to justify it. A flat structure that is consistently maintained is better than a feature structure applied inconsistently. Choose the simplest structure that keeps folders navigable, and migrate when the pain becomes real.

---

See also: [What are common anti-patterns in large Vue codebases?](/q/vue-anti-patterns) · [How do you architect a Vue 3 app to scale across multiple teams?](/q/scale-vue-multiple-teams) · [How does the Vue plugin system work?](/q/plugin-system)

## References

- [Project Structure](https://vuejs.org/guide/scaling-up/project-structure.html) - Vue.js docs  
- [Style Guide](https://vuejs.org/style-guide/) - Vue.js docs
- [Pinia](https://pinia.vuejs.org/) - Pinia docs
