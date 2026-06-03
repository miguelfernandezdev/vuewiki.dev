---
order: 99
title: 'When should you use Pinia vs a composable vs local state?'
difficulty: 'intermediate'
tags:
  ['state-management', 'architecture', 'pinia', 'watchers', 'provide-inject']
summary: 'Local state by default. Composable when logic is reusable across components. Pinia when state must be shared globally or survive navigation.'
---

Local state by default. Pinia only when there's a clear reason. The decision depends on three questions: how many components need this data, whether it must survive page navigation, and whether the logic is reusable. The anti-pattern is putting everything in a store "just in case," which creates a bloated global state where 80% is local state in disguise.

## Decision tree

```
Does only ONE component use this data?
  → Yes: local ref

Must the data survive navigation between pages?
  → Yes: Pinia store (or useState in Nuxt)

Do multiple components that are NOT parent-child need this data?
  → Yes: Pinia store

Is it complex business logic with async operations?
  → Yes: Pinia store

Is it reusable logic but each consumer needs its OWN instance?
  → Yes: composable

Is it UI state (modal open, active tab, form values)?
  → Yes: local ref (or composable if the pattern repeats)
```

## Local state (ref in the component)

The simplest option. State lives in the component, dies when the component unmounts.

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

Use for: form inputs, toggle states, UI interactions, anything that only matters to this component.

## Composable (reusable logic, own instance per consumer)

A function that encapsulates reactive state and logic. Each component that calls it gets its own independent copy:

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
<!-- ProductSearch.vue — gets its own query, results, loading -->
<script setup>
const { query, results, isLoading } = useSearch('/api/products')
</script>

<!-- UserSearch.vue — completely independent instance -->
<script setup>
const { query, results, isLoading } = useSearch('/api/users')
</script>
```

<PlaygroundLink code="<!-- ProductSearch.vue — gets its own query, results, loading -->

<script setup>
const { query, results, isLoading } = useSearch('/api/products')
</script>

&#10;<!-- UserSearch.vue — completely independent instance -->

<script setup>
const { query, results, isLoading } = useSearch('/api/users')
</script>" />

Use for: data fetching patterns, form validation, timers, browser APIs, any reusable logic where each consumer needs its own state.

## Pinia store (shared global state)

State that lives outside components and is shared across the application:

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

The cart is used by the product page (add to cart button), the header (cart count badge), and the checkout page (cart summary). All three reference the same store instance.

Use for: authenticated user, shopping cart, shared filters, notification queue, any data shared across unrelated components that must persist during navigation.

## Concrete examples

| State                                      | Where      | Why                                               |
| ------------------------------------------ | ---------- | ------------------------------------------------- |
| Authenticated user                         | Pinia      | Global, persists across pages, used everywhere    |
| Shopping cart items                        | Pinia      | Shared across product page, header, checkout      |
| Search filters used by multiple components | Pinia      | Shared between sidebar and results list           |
| Cached API response used on multiple pages | Pinia      | Survives navigation, avoids refetching            |
| Modal open/closed                          | Local ref  | Only the component with the modal cares           |
| Active tab in a tab component              | Local ref  | UI state, no other component needs it             |
| Form input values                          | Local ref  | Local to the form                                 |
| Reusable debounced search logic            | Composable | Same pattern, independent instances               |
| Intersection observer logic                | Composable | Reusable, each component observes its own element |

## The shared composable pattern (singleton)

If you define the state outside the function, all consumers share it. This is a lightweight alternative to Pinia for simple shared state:

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

Every component that calls `useTheme()` gets the same `theme` ref. This works for simple cases but lacks DevTools integration, plugin support, and the structural conventions that Pinia provides. In Nuxt, module-scope state like this leaks between requests during SSR. Use `useState` or Pinia instead.

## When people over-use Pinia

```ts
// DON'T: store for state that only one component uses
export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  return { isOpen }
})

// DO: just use a local ref
const isModalOpen = ref(false)
```

```ts
// DON'T: store for data that could be a prop
export const useSelectedUserStore = defineStore('selectedUser', () => {
  const userId = ref<number | null>(null)
  return { userId }
})

// DO: pass it as a prop or use provide/inject for deep trees
```

If you can solve it with a ref, a prop, or an emit, you don't need a store.

See also: [How does Pinia work?](/q/how-pinia-works) · [What is a composable?](/q/what-is-a-composable) · [What is lifting state up?](/q/lifting-state-up)

## References

- [Defining Stores](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
