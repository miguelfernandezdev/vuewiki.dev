---
order: 155
title: "¿Cómo se prueba un store de Pinia?"
difficulty: "intermediate"
tags: ["testing", "state-management"]
---

Crea una instancia de Pinia nueva en `beforeEach` con `setActivePinia(createPinia())`. Esto le da a cada test un store aislado con estado limpio. Luego llama a la función composable del store, interactúa con sus acciones y comprueba su estado y getters. Para acciones asíncronas que llaman a APIs, simula `fetch` o `$fetch` con `vi.fn()`.

## El store bajo prueba

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

## Tests básicos: estado, getters y acciones

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cart'

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('comienza con el carrito vacío', () => {
    const store = useCartStore()
    expect(store.items).toEqual([])
    expect(store.itemCount).toBe(0)
    expect(store.total).toBe(0)
  })

  it('añade un artículo', () => {
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Widget', price: 9.99 })

    expect(store.itemCount).toBe(1)
    expect(store.total).toBe(9.99)
    expect(store.items[0].name).toBe('Widget')
  })

  it('elimina un artículo', () => {
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

`setActivePinia(createPinia())` en `beforeEach` hace que cada test tenga un store limpio. Sin esto, el estado se filtra entre tests.

## Probar acciones asíncronas con fetch simulado

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

  it('envía los artículos a la API y vacía el carrito', async () => {
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

  it('mantiene los artículos si la llamada a la API falla', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Widget', price: 9.99 })

    await expect(store.checkout()).rejects.toThrow('Network error')
    expect(store.items).toHaveLength(1)
  })
})
```

## Probar stores que usan otros stores

Los stores de Pinia pueden importar otros stores. Como cada test crea una Pinia nueva, todos los stores del mismo test comparten esa instancia:

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

  it('realiza un pedido con los artículos del carrito', async () => {
    const cart = useCartStore()
    const order = useOrderStore()

    cart.addItem({ id: 1, name: 'Widget', price: 9.99 })
    await order.placeOrder('Calle Mayor 123')

    expect(fetch).toHaveBeenCalled()
    expect(cart.items).toHaveLength(0)
  })

  it('rechaza cuando el carrito está vacío', async () => {
    const order = useOrderStore()
    await expect(order.placeOrder('Calle Mayor 123')).rejects.toThrow('Cart is empty')
  })
})
```

Tanto `useCartStore()` como `useOrderStore()` usan la misma instancia de Pinia creada en `beforeEach`, así que interactúan correctamente.

## Probar con $subscribe y $onAction

Pinia ofrece hooks para observar la actividad del store:

```ts
it('notifica al ejecutar una acción', () => {
  const store = useCartStore()
  const actions: string[] = []

  store.$onAction(({ name }) => {
    actions.push(name)
  })

  store.addItem({ id: 1, name: 'Widget', price: 9.99 })
  store.removeItem(1)

  expect(actions).toEqual(['addItem', 'removeItem'])
})

it('notifica cuando cambia el estado', () => {
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

## Lista de comprobación

| Paso | Por qué |
|---|---|
| `setActivePinia(createPinia())` en `beforeEach` | Aislar el estado del store entre tests |
| Llamar a las acciones del store directamente | Probar el comportamiento, no la implementación |
| Simular `fetch` / `$fetch` con `vi.fn()` | Controlar las respuestas de la API sin servidor |
| Comprobar el estado Y los getters | Los getters son computed, verifica que reaccionan a los cambios de estado |
| Probar los caminos de error | Verifica que el store gestiona los fallos de la API correctamente |
| Restaurar los mocks en `afterEach` si es necesario | Evitar que los mocks se filtren entre archivos de test |

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Cómo testear un composable que usa fetch?](/es/q/testing-composable-fetch)

## Referencias

- [Testing Stores](https://pinia.vuejs.org/cookbook/testing.html) - Pinia docs
- [createTestingPinia](https://pinia.vuejs.org/cookbook/testing.html#Unit-testing-a-store) - Pinia docs
