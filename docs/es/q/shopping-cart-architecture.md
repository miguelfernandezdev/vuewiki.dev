---
order: 136
title: "¿Cómo construirías un carrito de compra con Vue?"
difficulty: "advanced"
tags: ["architecture", "state-management", "pinia"]
summary: "Usa un store Pinia para el estado del carrito compartido entre páginas. Actions manejan añadir/eliminar, getters calculan totales. Persiste en localStorage."
---

Un carrito de compra es un problema clásico de gestión de estado. El estado del carrito debe compartirse entre varias páginas (lista de productos, cajón del carrito, checkout), persistir al recargar la página y actualizarse desde distintos lugares. Un store de Pinia es la solución natural.

## Store del carrito

```ts
// stores/cart.ts
interface CartItem {
  id: string
  name: string
  price: number
  image: string
  qty: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.qty, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
  )

  function addItem(product: Omit<CartItem, 'qty'>, qty = 1) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      items.value.push({ ...product, qty })
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function updateQty(id: string, qty: number) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    if (qty <= 0) {
      removeItem(id)
    } else {
      item.qty = qty
    }
  }

  function clear() {
    items.value = []
  }

  return { items, totalItems, totalPrice, addItem, removeItem, updateQty, clear }
})
```

## Lista de productos (añadir al carrito)

```vue
<!-- components/ProductCard.vue -->
<script setup lang="ts">
const props = defineProps<{
  id: string
  name: string
  price: number
  image: string
}>()

const cart = useCartStore()

function addToCart() {
  cart.addItem({
    id: props.id,
    name: props.name,
    price: props.price,
    image: props.image
  })
}
</script>

<template>
  <div class="product-card">
    <img :src="image" :alt="name" />
    <h3>{{ name }}</h3>
    <p>{{ price.toFixed(2) }} €</p>
    <button @click="addToCart">Add to cart</button>
  </div>
</template>
```

## Cajón del carrito (ver y editar)

```vue
<!-- components/CartDrawer.vue -->
<script setup lang="ts">
const cart = useCartStore()
</script>

<template>
  <aside class="cart-drawer">
    <h2>Cart ({{ cart.totalItems }})</h2>

    <p v-if="!cart.items.length">Your cart is empty.</p>

    <div v-for="item in cart.items" :key="item.id" class="cart-item">
      <img :src="item.image" :alt="item.name" />
      <div>
        <p>{{ item.name }}</p>
        <p>{{ item.price.toFixed(2) }} € × {{ item.qty }}</p>
      </div>
      <div class="qty-controls">
        <button @click="cart.updateQty(item.id, item.qty - 1)">−</button>
        <span>{{ item.qty }}</span>
        <button @click="cart.updateQty(item.id, item.qty + 1)">+</button>
      </div>
      <button @click="cart.removeItem(item.id)">Remove</button>
    </div>

    <div v-if="cart.items.length" class="cart-total">
      <strong>Total: {{ cart.totalPrice.toFixed(2) }} €</strong>
      <NuxtLink to="/checkout">Checkout</NuxtLink>
    </div>
  </aside>
</template>
```

## Persistencia con un plugin de Pinia

El carrito desaparece al recargar la página sin persistencia. Usar `pinia-plugin-persistedstate` o un simple `$subscribe`:

```ts
// plugins/cart-persist.ts
const cart = useCartStore()

if (import.meta.client) {
  const saved = localStorage.getItem('cart')
  if (saved) {
    cart.$patch({ items: JSON.parse(saved) })
  }

  cart.$subscribe((_, state) => {
    localStorage.setItem('cart', JSON.stringify(state.items))
  })
}
```

O con el plugin:

```bash
npm install pinia-plugin-persistedstate
```

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  // ... igual que antes
}, {
  persist: true
})
```

## Badge del carrito en la cabecera

```vue
<!-- components/CartBadge.vue -->
<script setup>
const cart = useCartStore()
</script>

<template>
  <button class="cart-icon">
    🛒
    <span v-if="cart.totalItems" class="badge">{{ cart.totalItems }}</span>
  </button>
</template>
```

El badge se actualiza reactivamente desde cualquier página porque todos los componentes comparten la misma instancia del store de Pinia.

## Flujo de checkout

```vue
<!-- pages/checkout.vue -->
<script setup>
const cart = useCartStore()
const isSubmitting = ref(false)

async function placeOrder() {
  isSubmitting.value = true
  try {
    await $fetch('/api/orders', {
      method: 'POST',
      body: {
        items: cart.items.map(i => ({ id: i.id, qty: i.qty }))
      }
    })
    cart.clear()
    navigateTo('/order-confirmation')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <h1>Checkout</h1>
    <div v-for="item in cart.items" :key="item.id">
      {{ item.name }} × {{ item.qty }} — {{ (item.price * item.qty).toFixed(2) }} €
    </div>
    <p><strong>Total: {{ cart.totalPrice.toFixed(2) }} €</strong></p>
    <button :disabled="isSubmitting || !cart.items.length" @click="placeOrder">
      Place order
    </button>
  </div>
</template>
```

## Resumen de la arquitectura

```
ProductCard → cart.addItem()
CartDrawer  → cart.items, cart.updateQty(), cart.removeItem()
CartBadge   → cart.totalItems
Checkout    → cart.items, cart.clear()
                    ↓
              Store Pinia (fuente única de verdad)
                    ↓
              localStorage (plugin de persistencia)
```

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Qué son los plugins de Pinia?](/es/q/pinia-plugins) · [¿Cuándo usar Pinia vs composable vs ref local?](/es/q/pinia-vs-composable-vs-local)

## Referencias

- [Defining Stores](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) - Persisted state plugin docs
- [Computed Properties](https://vuejs.org/guide/essentials/computed.html) - Vue.js docs
