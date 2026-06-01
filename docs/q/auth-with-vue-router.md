---
order: 119
title: "How would you implement authentication with Vue Router?"
difficulty: "advanced"
tags: ["vue-router", "architecture"]
---

The standard approach combines a composable or store for auth state, a navigation guard to protect routes, and route meta to declare which pages need authentication. The guard checks auth state before every navigation and redirects unauthenticated users to login.

## Auth composable

```ts
// composables/useAuth.ts
const user = ref<User | null>(null)
const token = ref<string | null>(localStorage.getItem('token'))

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials: { email: string; password: string }) {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) throw new Error('Invalid credentials')

    const data = await response.json()
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, login, logout }
}
```

## Route meta

Mark which routes require authentication:

```ts
// router/index.ts
const routes = [
  { path: '/login', component: LoginPage },
  { path: '/', component: HomePage },
  {
    path: '/dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: AdminPage,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  }
]
```

## Navigation guard

```ts
// router/index.ts
const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const { isAuthenticated, user } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.role && user.value?.role !== to.meta.role) {
    return { path: '/' }
  }
})
```

The `redirect` query parameter remembers where the user was going. After login, redirect them back:

```ts
// In login page after successful login
const route = useRoute()
const router = useRouter()

async function handleLogin() {
  await login(credentials)
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.push(redirect)
}
```

## Type the route meta

```ts
// router/index.ts
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    role?: 'admin' | 'user'
  }
}
```

Now `to.meta.requiresAuth` and `to.meta.role` are typed throughout the app.

## Sending the token with requests

Use a fetch wrapper or interceptor that attaches the token to every request:

```ts
// utils/api.ts
export async function apiFetch(url: string, options: RequestInit = {}) {
  const { token } = useAuth()

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token.value && { Authorization: `Bearer ${token.value}` })
    }
  })

  if (response.status === 401) {
    const { logout } = useAuth()
    logout()
    window.location.href = '/login'
  }

  return response
}
```

## Persisting auth on refresh

The token is in localStorage, but the user object isn't. Restore it on app startup:

```ts
// plugins/auth.ts or App.vue
const { token, user } = useAuth()

if (token.value && !user.value) {
  try {
    const response = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    user.value = await response.json()
  } catch {
    token.value = null
    localStorage.removeItem('token')
  }
}
```

## Nuxt approach

In Nuxt, use route middleware instead of `router.beforeEach`:

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
```

```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

Use `useCookie` instead of `localStorage` for SSR-safe token storage:

```ts
const token = useCookie('auth-token')
```

## Auth flow summary

```
1. User visits /dashboard
2. Guard checks meta.requiresAuth → true
3. Guard checks isAuthenticated → false
4. Guard redirects to /login?redirect=/dashboard
5. User logs in → token saved, user loaded
6. Router pushes to /dashboard (from redirect query)
7. Guard checks isAuthenticated → true → allows navigation
```
