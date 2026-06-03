---
order: 104
title: '¿Cómo implementarías la autenticación con Vue Router?'
difficulty: 'advanced'
tags: ['vue-router', 'architecture']
summary: 'Combina un store/composable de auth, un guard beforeEach y meta fields en las rutas. Guarda tokens en cookies para compatibilidad con SSR.'
---

El enfoque estándar combina un composable o store para el estado de autenticación, un navigation guard para proteger las rutas, y meta de ruta para declarar qué páginas requieren autenticación. El guard comprueba el estado de autenticación antes de cada navegación y redirige a los usuarios no autenticados al login.

## Composable de autenticación

```ts
// composables/useAuth.ts
// Estado a nivel de módulo — válido para SPAs solo de cliente.
// En SSR/Nuxt, se comparte entre peticiones. Ver "Contaminación de estado entre peticiones"
// (/es/q/ssr-cross-request-state-pollution) para la alternativa segura con useState o factorías por petición.
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

## Meta de ruta

Marca qué rutas requieren autenticación:

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

El parámetro `redirect` en la query recuerda adónde iba el usuario. Después del login, redirige de vuelta:

```ts
// En la página de login después de un login exitoso
const route = useRoute()
const router = useRouter()

async function handleLogin() {
  await login(credentials)
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.push(redirect)
}
```

## Tipificar la meta de ruta

```ts
// router/index.ts
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    role?: 'admin' | 'user'
  }
}
```

Ahora `to.meta.requiresAuth` y `to.meta.role` están tipados en toda la aplicación.

## Enviar el token con las peticiones

Usa un wrapper de fetch o un interceptor que adjunte el token a cada petición:

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

## Persistir la autenticación al recargar

El token está en localStorage, pero el objeto user no. Restáuralo al iniciar la aplicación:

```ts
// plugins/auth.ts o App.vue
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

## Enfoque en Nuxt

En Nuxt, usa middleware de ruta en lugar de `router.beforeEach`:

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

<PlaygroundLink code="<!-- pages/dashboard.vue -->

<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>" />

Usa `useCookie` en lugar de `localStorage` para el almacenamiento del token compatible con SSR:

```ts
const token = useCookie('auth-token')
```

## Resumen del flujo de autenticación

```
1. El usuario visita /dashboard
2. El guard comprueba meta.requiresAuth → true
3. El guard comprueba isAuthenticated → false
4. El guard redirige a /login?redirect=/dashboard
5. El usuario inicia sesión → token guardado, usuario cargado
6. El router navega a /dashboard (desde el parámetro redirect)
7. El guard comprueba isAuthenticated → true → permite la navegación
```

Ver también: [¿Cómo funciona Vue Router?](/es/q/vue-router-navigation-guards) · [¿Cómo implementar autenticación en Nuxt?](/es/q/nuxt-authentication) · [¿Cuál es la diferencia entre server middleware y route middleware?](/es/q/nuxt-server-vs-route-middleware)

## Referencias

- [Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html) - Vue Router docs
- [Route Meta Fields](https://router.vuejs.org/guide/advanced/meta.html) - Vue Router docs
- [Per-Route Guard](https://router.vuejs.org/guide/advanced/navigation-guards.html#Per-Route-Guard) - Vue Router docs
