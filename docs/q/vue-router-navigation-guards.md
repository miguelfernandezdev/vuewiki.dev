---
order: 103
title: "How does Vue Router work and what are navigation guards?"
difficulty: "intermediate"
tags: ["vue-router"]
---

Vue Router maps URL paths to components. When the URL changes, Vue Router renders the matching component without a full page reload. Navigation guards are hooks that run before, during, or after each navigation, letting you control access, cancel navigations, or run side effects.

## Basic setup

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/Home.vue') },
    {
      path: '/dashboard',
      component: () => import('./views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/:pathMatch(.*)*', component: () => import('./views/NotFound.vue') }
  ]
})
```

`createWebHistory()` uses the browser's History API for clean URLs (`/dashboard`). `createWebHashHistory()` uses hash-based URLs (`/#/dashboard`) for environments without server-side URL rewriting.

Each `() => import(...)` is a dynamic import that creates a separate JavaScript chunk, loaded only when the user navigates to that route.

## Navigation guards

Guards intercept navigations at three levels: global, per-route, and in-component.

### Global guards

Run on every navigation in the app:

```ts
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

Returning a route object redirects. Returning `false` cancels the navigation. Returning nothing (or `true`) allows it.

### Per-route guards

Run only for a specific route:

```ts
const routes = [
  {
    path: '/admin',
    component: () => import('./views/Admin.vue'),
    beforeEnter: (to, from) => {
      if (!isAdmin()) return { path: '/' }
    }
  }
]
```

### In-component guards

Run inside the component being navigated to or from:

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    return confirm('Leave without saving?')
  }
})

onBeforeRouteUpdate((to, from) => {
  // same component, different params (e.g. /users/1 → /users/2)
  loadUser(to.params.id)
})
</script>
```

## Guard execution order

When navigating from `/a` to `/b`:

1. `onBeforeRouteLeave` in the component being left
2. `router.beforeEach` (global)
3. `beforeEnter` on the target route (per-route)
4. `onBeforeRouteUpdate` if reusing a component
5. `router.beforeResolve` (global, after async components resolve)
6. Navigation confirmed
7. `router.afterEach` (global, no cancellation possible)

## Route meta

Attach arbitrary data to routes via `meta`. Guards and components can read it:

```ts
const routes = [
  {
    path: '/settings',
    component: () => import('./views/Settings.vue'),
    meta: { requiresAuth: true, title: 'Settings' }
  }
]

router.afterEach((to) => {
  document.title = (to.meta.title as string) ?? 'My App'
})
```

## Common patterns

| Need | Guard | Where |
| --- | --- | --- |
| Protect authenticated routes | `beforeEach` | Global |
| Prevent leaving unsaved forms | `onBeforeRouteLeave` | In-component |
| Redirect old URLs | `beforeEnter` | Per-route |
| Analytics/page tracking | `afterEach` | Global |
| Set page title | `afterEach` | Global |
| Wait for async data before showing page | `beforeResolve` | Global |

See also: [How do you implement authentication with Vue Router?](/q/auth-with-vue-router) · [How does Nuxt file-based routing work?](/q/nuxt-file-based-routing) · [How would you implement lazy loading?](/q/lazy-loading-code-splitting)

## References

- [Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html) - Vue Router docs
- [Route Meta Fields](https://router.vuejs.org/guide/advanced/meta.html) - Vue Router docs
- [Getting Started](https://router.vuejs.org/guide/) - Vue Router docs
