---
order: 122
title: "How would you structure a micro-frontend with Vue?"
difficulty: "advanced"
tags: ["architecture", "pinia", "vite", "provide-inject"]
---

Micro-frontends split a large frontend into independent apps that are developed, deployed, and run separately. Each team owns a feature and ships it without coordinating releases with others. In Vue, the main approaches are Module Federation, Web Components, and iframe-based composition.

## Module Federation (Vite/Webpack)

Module Federation lets one app load components from another at runtime. Each micro-frontend is a separate Vite/Webpack build that exposes specific modules.

**Remote app** (the micro-frontend that exposes components):

```ts
// vite.config.ts (remote: checkout-app)
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'checkout',
      filename: 'remoteEntry.js',
      exposes: {
        './CheckoutForm': './src/components/CheckoutForm.vue',
        './CartSummary': './src/components/CartSummary.vue'
      },
      shared: ['vue', 'pinia']
    })
  ]
})
```

**Host app** (the shell that consumes micro-frontends):

```ts
// vite.config.ts (host: shell-app)
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'shell',
      remotes: {
        checkout: 'http://checkout.example.com/assets/remoteEntry.js'
      },
      shared: ['vue', 'pinia']
    })
  ]
})
```

```vue
<!-- In the shell app -->
<script setup>
import CheckoutForm from 'checkout/CheckoutForm'
</script>

<template>
  <CheckoutForm />
</template>
```

The `shared` config ensures both apps use the same Vue instance, so reactivity and provide/inject work across boundaries.

## Web Components approach

Each micro-frontend ships as a custom element. The shell app doesn't need to know it's Vue:

**Micro-frontend:**

```ts
// checkout-element/main.ts
import { defineCustomElement } from 'vue'
import CheckoutForm from './CheckoutForm.ce.vue'

const CheckoutElement = defineCustomElement(CheckoutForm)
customElements.define('checkout-form', CheckoutElement)
```

**Shell app (any framework, or plain HTML):**

```vue
<template>
  <checkout-form :cart-id="cartId" @order-placed="handleOrder" />
</template>
```

Pros: framework-agnostic, true isolation. Cons: no shared Vue context (provide/inject, devtools), CSS isolation can be tricky.

## Communication between micro-frontends

Micro-frontends are isolated, so they need explicit communication channels:

**Custom events (loosely coupled):**

```ts
// Micro-frontend A dispatches
window.dispatchEvent(new CustomEvent('cart:updated', {
  detail: { itemCount: 3 }
}))

// Micro-frontend B listens
window.addEventListener('cart:updated', (e: CustomEvent) => {
  badgeCount.value = e.detail.itemCount
})
```

**Shared event bus:**

```ts
// shared/event-bus.ts
type EventMap = {
  'cart:updated': { itemCount: number }
  'user:logged-in': { userId: string }
}

const listeners = new Map<string, Set<Function>>()

export function emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
  listeners.get(event)?.forEach(fn => fn(data))
}

export function on<K extends keyof EventMap>(event: K, fn: (data: EventMap[K]) => void) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(fn)
  return () => listeners.get(event)!.delete(fn)
}
```

**Shared Pinia store (Module Federation only):**

If both apps share the same Vue and Pinia instances via Module Federation, they can use the same store directly. This is simpler but couples the micro-frontends more tightly.

## Directory structure

```
apps/
├── shell/               ← host app (routing, layout, navigation)
│   ├── src/
│   │   ├── App.vue
│   │   └── router/
│   └── vite.config.ts
├── checkout/            ← micro-frontend (checkout team)
│   ├── src/
│   │   ├── components/
│   │   └── stores/
│   └── vite.config.ts
├── catalog/             ← micro-frontend (catalog team)
│   ├── src/
│   └── vite.config.ts
└── shared/              ← shared types, event bus, design tokens
    ├── types/
    └── event-bus.ts
```

## When to use micro-frontends

| Situation | Use micro-frontends? |
|---|---|
| Multiple teams working on separate features independently | Yes |
| Need to deploy features without full app release | Yes |
| Single team, medium-sized app | No, use a monolith with good architecture |
| Performance is critical (minimal overhead) | Probably no, adds loading complexity |
| Mixing Vue with React or Angular in one page | Yes, Web Components approach |

## Tradeoffs

Micro-frontends add complexity: shared dependency management, inter-app communication, routing coordination, consistent design system, and deployment orchestration. For most teams, a well-structured monolith with lazy-loaded routes and clear module boundaries is simpler and performs better. Micro-frontends make sense when organizational scaling (many teams, independent deploys) outweighs the technical cost.

See also: [How do you architect a Vue 3 app to scale across multiple teams?](/q/scale-vue-multiple-teams) · [How would you structure a large Vue project?](/q/large-project-structure) · [What are Nuxt layers?](/q/nuxt-layers)

## References

- [Web Components](https://vuejs.org/guide/extras/web-components.html) - Vue.js docs
- [Module Federation](https://module-federation.io/) - Module Federation docs
- [Micro Frontends](https://micro-frontends.org/) - micro-frontends.org
