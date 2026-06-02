---
order: 155
title: "How do you test a Pinia store?"
difficulty: "intermediate"
tags: ["testing", "state-management", "pinia", "vitest"]
---

Create a fresh Pinia instance in `beforeEach` with `setActivePinia(createPinia())`. This gives every test an isolated store with clean state. Then call the store's composable function, interact with its actions, and assert against its state and getters. For async actions that call APIs, mock `fetch` or `$fetch` with `vi.fn()`.

## The store under test

```ts
// stores/cart.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface CartItem {
  id: number
  name: string
  price: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const itemCount = computed(() => items.value.length)
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  )

  function addItem(item: CartItem) {
    items.value.push(item)
  }

  function removeItem(id: number) {
    items.value = items.value.filter(i => i.id !== id)
  }

  async function checkout() {
    await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(items.value)
    })
    items.value = []
  }

  return { items, itemCount, total, addItem, removeItem, checkout }
})
```

## Basic tests: state, getters, actions

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cart'

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with an empty cart', () => {
    const store = useCartStore()
    expect(store.items).toEqual([])
    expect(store.itemCount).toBe(0)
    expect(store.total).toBe(0)
  })

  it('adds an item', () => {
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Widget', price: 9.99 })

    expect(store.itemCount).toBe(1)
    expect(store.total).toBe(9.99)
    expect(store.items[0].name).toBe('Widget')
  })

  it('removes an item', () => {
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Widget', price: 9.99 })
    store.addItem({ id: 2, name: 'Gadget', price: 19.99 })

    store.removeItem(1)

    expect(store.itemCount).toBe(1)
    expect(store.items[0].id).toBe(2)
    expect(store.total).toBe(19.99)
  })
})
```

`setActivePinia(createPinia())` in `beforeEach` ensures each test gets a fresh store. Without it, state leaks between tests.

## Testing async actions with mocked fetch

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cart'

describe('useCartStore checkout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 200 }))
    )
  })

  it('sends items to the API and clears the cart', async () => {
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Widget', price: 9.99 })

    await store.checkout()

    expect(fetch).toHaveBeenCalledWith('/api/checkout', {
      method: 'POST',
      body: JSON.stringify([{ id: 1, name: 'Widget', price: 9.99 }])
    })
    expect(store.items).toHaveLength(0)
    expect(store.total).toBe(0)
  })

  it('keeps items if the API call fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Widget', price: 9.99 })

    await expect(store.checkout()).rejects.toThrow('Network error')
    expect(store.items).toHaveLength(1)
  })
})
```

## Testing stores that use other stores

Pinia stores can import other stores. Because each test creates a fresh Pinia, all stores in the same test share that instance:

```ts
// stores/order.ts
export const useOrderStore = defineStore('order', () => {
  const cart = useCartStore()

  async function placeOrder(address: string) {
    if (cart.itemCount === 0) throw new Error('Cart is empty')
    await $fetch('/api/orders', {
      method: 'POST',
      body: { items: cart.items, address }
    })
    cart.items = []
  }

  return { placeOrder }
})
```

```ts
describe('useOrderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 200 }))
    )
  })

  it('places an order with cart items', async () => {
    const cart = useCartStore()
    const order = useOrderStore()

    cart.addItem({ id: 1, name: 'Widget', price: 9.99 })
    await order.placeOrder('123 Main St')

    expect(fetch).toHaveBeenCalled()
    expect(cart.items).toHaveLength(0)
  })

  it('rejects when cart is empty', async () => {
    const order = useOrderStore()
    await expect(order.placeOrder('123 Main St')).rejects.toThrow('Cart is empty')
  })
})
```

Both `useCartStore()` and `useOrderStore()` use the same Pinia instance created in `beforeEach`, so they interact correctly.

## Testing with $subscribe and $onAction

Pinia provides hooks to observe store activity:

```ts
it('notifies on action', () => {
  const store = useCartStore()
  const actions: string[] = []

  store.$onAction(({ name }) => {
    actions.push(name)
  })

  store.addItem({ id: 1, name: 'Widget', price: 9.99 })
  store.removeItem(1)

  expect(actions).toEqual(['addItem', 'removeItem'])
})

it('notifies on state change', () => {
  const store = useCartStore()
  const snapshots: number[] = []

  store.$subscribe((mutation, state) => {
    snapshots.push(state.items.length)
  })

  store.addItem({ id: 1, name: 'Widget', price: 9.99 })
  store.addItem({ id: 2, name: 'Gadget', price: 19.99 })

  expect(snapshots).toEqual([1, 2])
})
```

## Checklist

| Step | Why |
|---|---|
| `setActivePinia(createPinia())` in `beforeEach` | Isolate store state between tests |
| Call store actions directly | Test behavior, not implementation |
| Mock `fetch` / `$fetch` with `vi.fn()` | Control API responses without a server |
| Assert state AND getters | Getters are computed, verify they react to state changes |
| Test error paths | Verify the store handles API failures correctly |
| Restore mocks in `afterEach` if needed | Prevent mock leaks between test files |

See also: [How does Pinia work?](/q/how-pinia-works) · [How do you test a composable that uses fetch?](/q/testing-composable-fetch)

## References

- [Testing Stores](https://pinia.vuejs.org/cookbook/testing.html) - Pinia docs
- [createTestingPinia](https://pinia.vuejs.org/cookbook/testing.html#Unit-testing-a-store) - Pinia docs
