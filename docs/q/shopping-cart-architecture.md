---
order: 136
title: 'How would you build a shopping cart with Vue?'
difficulty: 'advanced'
tags: ['architecture', 'state-management', 'pinia']
summary: 'Use a Pinia store for cart state shared across pages. Actions handle add/remove/clear, getters compute totals. Persist to localStorage via a plugin.'
---

A shopping cart is a classic state management problem. The cart state needs to be shared across multiple pages (product list, cart drawer, checkout), persisted across page refreshes, and updated from different places. A Pinia store is the natural fit.

## Cart store

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
    const existing = items.value.find((i) => i.id === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      items.value.push({ ...product, qty })
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  function updateQty(id: string, qty: number) {
    const item = items.value.find((i) => i.id === id)
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

  return {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQty,
    clear
  }
})
```

## Product list (adding to cart)

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

## Cart drawer (viewing and editing)

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

## Persistence with a Pinia plugin

The cart disappears on page refresh without persistence. Use `pinia-plugin-persistedstate` or a simple `$subscribe`:

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

Or with the plugin:

```bash
npm install pinia-plugin-persistedstate
```

```ts
// stores/cart.ts
export const useCartStore = defineStore(
  'cart',
  () => {
    // ... same as before
  },
  {
    persist: true
  }
)
```

## Header cart badge

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

The badge updates reactively from any page because all components share the same Pinia store instance.

## Checkout flow

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
        items: cart.items.map((i) => ({ id: i.id, qty: i.qty }))
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
      {{ item.name }} × {{ item.qty }} —
      {{ (item.price * item.qty).toFixed(2) }} €
    </div>
    <p>
      <strong>Total: {{ cart.totalPrice.toFixed(2) }} €</strong>
    </p>
    <button :disabled="isSubmitting || !cart.items.length" @click="placeOrder">
      Place order
    </button>
  </div>
</template>
```

## Architecture summary

```
ProductCard → cart.addItem()
CartDrawer  → cart.items, cart.updateQty(), cart.removeItem()
CartBadge   → cart.totalItems
Checkout    → cart.items, cart.clear()
                    ↓
              Pinia store (single source of truth)
                    ↓
              localStorage (persistence plugin)
```

See also: [How does Pinia work?](/q/how-pinia-works) · [What are Pinia plugins?](/q/pinia-plugins) · [When should state live in Pinia vs a composable vs a local ref?](/q/pinia-vs-composable-vs-local)

## References

- [Defining Stores](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) - Persisted state plugin docs
- [Computed Properties](https://vuejs.org/guide/essentials/computed.html) - Vue.js docs
