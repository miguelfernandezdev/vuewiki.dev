---
order: 18
title: "How does Vue Router work and what are navigation guards?"
difficulty: "intermediate"
---

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/Home.vue') },  // lazy loading
    {
      path: '/dashboard',
      component: () => import('./views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/:pathMatch(.*)*', component: () => import('./views/NotFound.vue') }
  ]
})

// Global guard
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

```vue
<!-- In-component guard -->
<script setup>
import { onBeforeRouteLeave } from 'vue-router'

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    return confirm('Leave without saving?')
  }
})
</script>
```
