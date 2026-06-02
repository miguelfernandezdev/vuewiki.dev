---
order: 98
title: "¿Qué es la contaminación de estado entre peticiones en SSR y cómo se evita?"
difficulty: "advanced"
tags: ["nuxt", "ssr", "state-management", "pinia", "provide-inject"]
---

En SSR, el proceso del servidor gestiona múltiples peticiones. Si declaras estado reactivo en el ámbito del módulo, ese estado es un singleton compartido por TODAS las peticiones. Los datos del usuario A pueden filtrarse a la respuesta del usuario B. Esto es una vulnerabilidad de seguridad, no solo un bug.

## Cómo ocurre

```ts
// composables/useUser.ts
const user = ref(null) // singleton a nivel de módulo

export function useUser() {
  return user
}
```

En el servidor, este `ref` se crea una vez cuando el módulo se carga. Cada petición que llama a `useUser()` obtiene la misma referencia:

1. La petición A llega, establece `user.value = { name: 'Alice' }`
2. La petición B llega antes de que A termine, lee `user.value` y ve los datos de Alice
3. La petición B establece `user.value = { name: 'Bob' }`
4. La respuesta de la petición A ahora contiene los datos de Bob

El problema afecta a cualquier estado mutable a nivel de módulo: `ref`, `reactive`, `Map`, `Set`, objetos planos, incluso una variable contador.

## Señales de alerta

```ts
// TODOS estos son peligrosos en el ámbito de módulo bajo SSR
export const user = ref(null)
export const appState = reactive({ theme: 'dark' })
export const cache = new Map()
let requestCount = 0
```

## Solución 1: useState (Nuxt)

El `useState` de Nuxt crea una instancia aislada por petición en el servidor:

```ts
// composables/useUser.ts
export function useUser() {
  return useState<User | null>('user', () => null)
}
```

Cada petición tiene su propio estado `'user'`. Tras el SSR, el valor se serializa en el payload y se hidrata en el cliente.

## Solución 2: Pinia

Pinia gestiona el aislamiento por petición automáticamente en Nuxt. Cada petición recibe una instancia de Pinia nueva:

```ts
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  async function login(credentials: Credentials) {
    user.value = await $fetch('/api/login', {
      method: 'POST',
      body: credentials
    })
  }

  return { user, isLoggedIn, login }
})
```

No hace falta ningún manejo especial. El módulo `@pinia/nuxt` se encarga de crear y destruir instancias del store por petición.

## Solución 3: patrón factory (Vue SSR sin Nuxt)

Si no usas Nuxt, crea instancias nuevas por petición manualmente:

```ts
// store.ts
export function createStore() {
  const state = reactive({
    user: null,
    cart: []
  })

  return {
    state: readonly(state),
    setUser(user: User) { state.user = user },
    addToCart(item: CartItem) { state.cart.push(item) }
  }
}
```

```ts
// entry-server.ts
export async function render(url: string) {
  const app = createApp(App)
  const store = createStore() // nuevo por cada petición
  app.provide('store', store)

  const html = await renderToString(app)
  return { html, state: store.state }
}
```

## La regla

Nunca declares estado mutable en el ámbito de módulo en código que se ejecuta en el servidor. Usa siempre una de estas opciones:

| Enfoque | Cuándo usarlo |
|---|---|
| `useState` | Proyectos Nuxt, valores compartidos simples |
| Pinia con `@pinia/nuxt` | Proyectos Nuxt, estado complejo con acciones y getters |
| Factory function + provide/inject | Vue SSR sin Nuxt |

Los valores inmutables a nivel de módulo (constantes, definiciones de tipos, funciones puras) son seguros porque no cambian entre peticiones.

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Cómo maneja Nuxt la gestión de estado?](/es/q/nuxt-state-management)

## Referencias

- [SSR](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Pinia SSR](https://pinia.vuejs.org/ssr/) - Pinia docs
