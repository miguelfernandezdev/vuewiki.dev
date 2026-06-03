---
order: 156
title: "¿Cómo funciona la gestión de estado en Nuxt? (useState, Pinia)"
difficulty: "intermediate"
tags: ["nuxt", "state-management", "pinia"]
summary: "useState para estado compartido compatible con SSR (serializado en el payload). Pinia para dominios complejos. Nunca uses ref plano a nivel de módulo."
---

Nuxt proporciona `useState`, un composable compatible con SSR para compartir estado reactivo entre componentes. Para estado complejo, se añade Pinia como módulo. La regla principal: nunca uses `ref` o `reactive` en el ámbito de módulo en Nuxt, porque ese estado se filtra entre peticiones en el servidor.

## useState

`useState` crea una referencia reactiva con clave que se serializa del servidor al cliente durante SSR:

```ts
const count = useState('count', () => 0)
```

El primer argumento es una clave única. El segundo es una función factory que devuelve el valor inicial. Cualquier componente que llame a `useState('count')` obtiene la misma referencia reactiva.

```vue
<!-- components/Counter.vue -->
<script setup>
const count = useState('count', () => 0)
</script>

<template>
  <button @click="count++">Contador: {{ count }}</button>
</template>
```

## Composables de estado compartido

Envuelve `useState` en composables para seguridad de tipos y reutilización:

```ts
// composables/useUser.ts
export function useUser() {
  return useState<User | null>('user', () => null)
}
```

```vue
<!-- Cualquier componente — la misma instancia de estado en todas partes -->
<script setup>
const user = useUser()
</script>
```

## Por qué no usar solo ref

Un `ref` declarado en el ámbito de módulo se comparte entre TODAS las peticiones en el servidor. Los datos del usuario A se filtran a la respuesta del usuario B.

```ts
// composables/useBad.ts
const user = ref(null) // MAL — compartido entre peticiones en el servidor

export function useBad() {
  return user
}
```

```ts
// composables/useGood.ts
export function useGood() {
  return useState('user', () => null) // cada petición obtiene su propia instancia
}
```

`useState` tiene ámbito por petición en el servidor y se serializa al cliente a través del payload de Nuxt, de modo que el estado se transfiere correctamente sin doble petición.

## Inicializar estado con datos asíncronos

Usa `callOnce` para ejecutar la lógica de inicialización solo una vez (en el servidor durante SSR, sin repetirse en el cliente):

```vue
<script setup>
const config = useState('config')

await callOnce(async () => {
  config.value = await $fetch('/api/config')
})
</script>
```

## Limpiar estado

```ts
clearNuxtState('count')

clearNuxtState(['count', 'user'])

clearNuxtState() // limpia todo
```

## Pinia en Nuxt

Para estado complejo con acciones, getters e integración con devtools, añade Pinia:

```bash
npx nuxi module add pinia
```

Los stores funcionan como Pinia normal. El módulo `@pinia/nuxt` los auto-importa desde `stores/`:

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
  )

  function addItem(product: Product) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.qty++
    } else {
      items.value.push({ ...product, qty: 1 })
    }
  }

  return { items, total, addItem }
})
```

```vue
<script setup>
const cart = useCartStore()
</script>

<template>
  <p>Total: {{ cart.total }}</p>
</template>
```

## useState vs Pinia

| | useState | Pinia |
|---|---|---|
| Configuración | Integrado, sin configuración | Requiere el módulo `@pinia/nuxt` |
| Estructura del estado | Un valor por clave | Estado agrupado + getters + acciones |
| DevTools | Básico | Depuración con viaje en el tiempo |
| Compatible con SSR | Sí | Sí (con el módulo de Nuxt) |
| Mejor para | Valores simples compartidos (idioma, tema, usuario actual) | Dominios complejos (carrito, auth, formularios multipaso) |

## Límites de serialización

Los valores de `useState` se serializan a JSON al transferirse del servidor al cliente. No puedes almacenar funciones, instancias de clases, símbolos o referencias circulares:

```ts
useState('fn', () => () => {})           // fallará
useState('data', () => ({ name: 'Vue' })) // funciona bien
```

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Cuándo usar Pinia vs composable vs ref local?](/es/q/pinia-vs-composable-vs-local) · [¿Qué es la contaminación de estado entre peticiones en SSR?](/es/q/ssr-cross-request-state-pollution)

## Referencias

- [State Management](https://nuxt.com/docs/getting-started/state-management) - Nuxt docs
- [useState](https://nuxt.com/docs/api/composables/use-state) - Nuxt docs
- [Pinia with Nuxt](https://pinia.vuejs.org/ssr/nuxt.html) - Pinia docs
