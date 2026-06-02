---
order: 147
title: "¿Cómo gestionas la autenticación en Nuxt 3?"
difficulty: "advanced"
tags: ["nuxt", "architecture"]
---

El patrón estándar usa cuatro piezas que trabajan juntas: un composable `useAuth` que expone el state de autenticación y sus métodos, un plugin que inicializa la sesión de usuario al arrancar la app, un middleware de ruta que protege páginas, y un middleware de servidor que protege las rutas de la API. Los tokens se almacenan en cookies (no en localStorage) porque las cookies son accesibles durante SSR.

## Por qué cookies y no localStorage

localStorage no existe en el servidor. Durante SSR, el servidor necesita saber quién es el usuario para renderizar contenido personalizado y proteger páginas. Las cookies se envían con cada petición HTTP, así que el servidor puede leerlas durante SSR y llamadas a la API.

```ts
// composables/useAuth.ts
export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const token = useCookie('auth-token', {
    maxAge: 60 * 60 * 24 * 7,  // 7 días
    sameSite: 'lax',
    secure: true
  })

  const loggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    const response = await $fetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    token.value = response.token
    user.value = response.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  async function fetchUser() {
    if (!token.value) {
      user.value = null
      return
    }
    try {
      user.value = await $fetch<User>('/api/auth/me')
    } catch {
      token.value = null
      user.value = null
    }
  }

  return { user, token, loggedIn, login, logout, fetchUser }
}
```

`useCookie` es compatible con SSR: lee desde las cabeceras de la petición en el servidor y desde `document.cookie` en el cliente. `useState` garantiza que el state del usuario no se filtre entre peticiones en el servidor.

## Plugin: inicializar la sesión al arrancar la app

```ts
// plugins/auth.ts
export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth()
  await fetchUser()
})
```

Se ejecuta una vez cuando la app arranca (tanto en servidor como en cliente). Si el usuario tiene una cookie de token válida, `fetchUser` carga su perfil. Si el token ha expirado o no es válido, limpia el state de autenticación.

## Middleware de ruta: proteger páginas

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

```ts
// middleware/guest.ts (redirige a usuarios autenticados fuera de la página de login)
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()

  if (loggedIn.value) {
    return navigateTo('/dashboard')
  }
})
```

Aplícalos a las páginas con `definePageMeta`:

```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({ middleware: 'auth' })
</script>
```

```vue
<!-- pages/login.vue -->
<script setup>
definePageMeta({ middleware: 'guest' })
</script>
```

## Middleware de servidor: proteger rutas de la API

El middleware de ruta solo protege páginas. Cualquiera puede llamar directamente a `/api/admin/users`. Protege los datos en la capa de servidor:

```ts
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const url = getRequestURL(event).pathname

  if (!url.startsWith('/api/') || url.startsWith('/api/auth/')) {
    return  // omitir rutas no-API y endpoints de auth públicos
  }

  const token = getCookie(event, 'auth-token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
  }

  try {
    event.context.user = verifyJWT(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido' })
  }
})
```

Ahora cada ruta de la API puede acceder al usuario autenticado a través de `event.context.user`:

```ts
// server/api/auth/me.get.ts
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401 })
  return user
})
```

## Rutas de la API de servidor: login y logout

```ts
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const user = await findUserByEmail(email)
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciales inválidas' })
  }

  const token = signJWT({ userId: user.id, role: user.role })

  // No httpOnly — el composable del cliente (useCookie) lee y escribe
  // esta cookie directamente. Si necesitas cookies httpOnly para mayor
  // protección contra XSS, el servidor debe gestionar todo el acceso a
  // la cookie y el cliente debería comprobar el estado de autenticación
  // a través de un endpoint del servidor (ej. /api/auth/me) en lugar
  // de leer la cookie con useCookie.
  setCookie(event, 'auth-token', token, {
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
})
```

```ts
// server/api/auth/logout.post.ts
export default defineEventHandler((event) => {
  deleteCookie(event, 'auth-token')
  return { ok: true }
})
```

Dado que el composable `useCookie('auth-token')` del lado del cliente lee y escribe la cookie directamente (para login, logout y la comprobación `loggedIn`), la cookie NO debe ser `httpOnly`. Una cookie `httpOnly` no puede ser accedida por JavaScript en absoluto — `useCookie` leería `null`. Si necesitas la protección más fuerte contra XSS que ofrecen las cookies `httpOnly`, el servidor debe gestionar todas las operaciones con la cookie y el cliente NO debería usar `useCookie` para leer el token. En su lugar, comprueba el estado de autenticación a través de un endpoint del servidor como `/api/auth/me`.

## Cómo encajan las piezas

```
La app arranca
  → plugin auth se ejecuta → fetchUser() → lee la cookie → carga el usuario

Usuario visita /dashboard
  → middleware auth → ¿loggedIn? → sí → renderizar página
                                 → no → redirigir a /login

Usuario llama a /api/admin/users
  → middleware del servidor → ¿token válido? → sí → adjuntar usuario al contexto → gestionar petición
                                              → no → 401 No autorizado

Usuario hace clic en logout
  → useAuth().logout() → POST /api/auth/logout → borrar cookie → borrar state → redirigir
```

## Resumen

| Pieza | Ubicación | Responsabilidad |
|---|---|---|
| Composable `useAuth` | `composables/` | State de auth, métodos login/logout |
| Plugin de auth | `plugins/` | Inicializar sesión al arrancar la app |
| Middleware de ruta | `middleware/` | Proteger páginas, redirigir usuarios no autenticados |
| Middleware de servidor | `server/middleware/` | Proteger rutas de la API, validar tokens |
| Rutas de la API de servidor | `server/api/auth/` | Login, logout, gestión de tokens |
| Cookie | Enviada con cada petición | Almacenamiento del token (compatible con SSR) |

Ver también: [¿Cómo implementar autenticación con Vue Router?](/es/q/auth-with-vue-router) · [¿Qué es el middleware de Nuxt?](/es/q/nuxt-middleware) · [¿Cuál es la diferencia entre server middleware y route middleware?](/es/q/nuxt-server-vs-route-middleware)

## Referencias

- [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) - GitHub
- [middleware/ Directory](https://nuxt.com/docs/guide/directory-structure/middleware) - Nuxt docs
- [useCookie](https://nuxt.com/docs/api/composables/use-cookie) - Nuxt docs
