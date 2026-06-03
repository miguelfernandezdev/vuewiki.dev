---
order: 99
title: '¿Cuándo usar Pinia, un composable o estado local?'
difficulty: 'intermediate'
tags:
  ['state-management', 'architecture', 'pinia', 'watchers', 'provide-inject']
summary: 'Estado local por defecto. Composable cuando la lógica es reutilizable. Pinia cuando el estado debe compartirse globalmente o sobrevivir a la navegación.'
---

Estado local por defecto. Pinia solo cuando hay una razón clara. La decisión depende de tres preguntas: cuántos componentes necesitan estos datos, si deben sobrevivir a la navegación entre páginas y si la lógica es reutilizable. El anti-patrón es meter todo en un store "por si acaso", lo que genera un estado global inflado donde el 80% es estado local disfrazado.

## Árbol de decisión

```
¿Solo UN componente usa estos datos?
  → Sí: ref local

¿Deben los datos sobrevivir la navegación entre páginas?
  → Sí: Pinia store (o useState en Nuxt)

¿Varios componentes que NO son padre-hijo necesitan estos datos?
  → Sí: Pinia store

¿Es lógica de negocio compleja con operaciones asíncronas?
  → Sí: Pinia store

¿Es lógica reutilizable pero cada consumidor necesita su PROPIA instancia?
  → Sí: composable

¿Es estado de UI (modal abierto, pestaña activa, valores de formulario)?
  → Sí: ref local (o composable si el patrón se repite)
```

## Estado local (ref en el componente)

La opción más sencilla. El estado vive en el componente y desaparece cuando se desmonta.

```vue
<script setup>
const isModalOpen = ref(false)
const activeTab = ref('general')
const searchQuery = ref('')
</script>
```

<PlaygroundLink code="<script setup>
const isModalOpen = ref(false)
const activeTab = ref('general')
const searchQuery = ref('')
</script>" />

Usar para: inputs de formulario, estados toggle, interacciones de UI, cualquier cosa que solo importe a este componente.

## Composable (lógica reutilizable, instancia propia por consumidor)

Una función que encapsula estado reactivo y lógica. Cada componente que la llama obtiene su propia copia independiente:

```ts
// composables/useSearch.ts
export function useSearch(endpoint: string) {
  const query = ref('')
  const results = ref([])
  const isLoading = ref(false)

  async function search() {
    isLoading.value = true
    results.value = await $fetch(endpoint, {
      params: { q: query.value }
    })
    isLoading.value = false
  }

  const debouncedSearch = useDebounceFn(search, 300)
  watch(query, debouncedSearch)

  return { query, results, isLoading, search }
}
```

```vue
<!-- ProductSearch.vue — tiene su propio query, results, loading -->
<script setup>
const { query, results, isLoading } = useSearch('/api/products')
</script>

<!-- UserSearch.vue — instancia completamente independiente -->
<script setup>
const { query, results, isLoading } = useSearch('/api/users')
</script>
```

<PlaygroundLink code="<!-- ProductSearch.vue — tiene su propio query, results, loading -->

<script setup>
const { query, results, isLoading } = useSearch('/api/products')
</script>

&#10;<!-- UserSearch.vue — instancia completamente independiente -->

<script setup>
const { query, results, isLoading } = useSearch('/api/users')
</script>" />

Usar para: patrones de petición de datos, validación de formularios, timers, APIs del navegador, cualquier lógica reutilizable donde cada consumidor necesite su propio estado.

## Pinia store (estado global compartido)

Estado que vive fuera de los componentes y se comparte en toda la aplicación:

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function addItem(product: Product) {
    const existing = items.value.find((i) => i.productId === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      })
    }
  }

  function removeItem(productId: string) {
    items.value = items.value.filter((i) => i.productId !== productId)
  }

  return { items, total, addItem, removeItem }
})
```

El carrito lo usan la página de producto (botón de añadir al carrito), la cabecera (badge con el recuento) y la página de checkout (resumen del carrito). Los tres referencian la misma instancia del store.

Usar para: usuario autenticado, carrito de compra, filtros compartidos, cola de notificaciones, cualquier dato compartido entre componentes no relacionados que deba persistir durante la navegación.

## Ejemplos concretos

| Estado                                            | Dónde      | Por qué                                                  |
| ------------------------------------------------- | ---------- | -------------------------------------------------------- |
| Usuario autenticado                               | Pinia      | Global, persiste entre páginas, se usa en todas partes   |
| Artículos del carrito                             | Pinia      | Compartido entre página de producto, cabecera y checkout |
| Filtros de búsqueda usados por varios componentes | Pinia      | Compartido entre sidebar y lista de resultados           |
| Respuesta de API cacheada usada en varias páginas | Pinia      | Sobrevive la navegación, evita re-fetch                  |
| Modal abierto/cerrado                             | ref local  | Solo le importa al componente que tiene el modal         |
| Pestaña activa en un componente de pestañas       | ref local  | Estado de UI, ningún otro componente lo necesita         |
| Valores de un formulario                          | ref local  | Local al formulario                                      |
| Lógica de búsqueda con debounce reutilizable      | Composable | Mismo patrón, instancias independientes                  |
| Lógica de Intersection Observer                   | Composable | Reutilizable, cada componente observa su propio elemento |

## El patrón de composable compartido (singleton)

Si el estado se define fuera de la función, todos los consumidores lo comparten. Esto es una alternativa ligera a Pinia para estado compartido sencillo:

```ts
// composables/useTheme.ts
const theme = ref<'light' | 'dark'>('light')

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  return { theme, toggle }
}
```

Cada componente que llama a `useTheme()` obtiene el mismo ref `theme`. Funciona para casos sencillos, pero carece de integración con DevTools, soporte de plugins y las convenciones estructurales que ofrece Pinia. En Nuxt, un estado a nivel de módulo como este se filtra entre peticiones durante SSR. Usar `useState` o Pinia en su lugar.

## Cuándo la gente abusa de Pinia

```ts
// NO hacer: store para estado que solo usa un componente
export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  return { isOpen }
})

// SÍ hacer: simplemente usar un ref local
const isModalOpen = ref(false)
```

```ts
// NO hacer: store para datos que podrían ser una prop
export const useSelectedUserStore = defineStore('selectedUser', () => {
  const userId = ref<number | null>(null)
  return { userId }
})

// SÍ hacer: pasarlo como prop o usar provide/inject para árboles profundos
```

Si se puede resolver con un ref, una prop o un emit, no hace falta un store.

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Qué es lifting state up?](/es/q/lifting-state-up)

## Referencias

- [Defining Stores](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
