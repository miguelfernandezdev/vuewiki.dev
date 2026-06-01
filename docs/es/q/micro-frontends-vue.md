---
order: 122
title: "¿Cómo estructurarías un micro-frontend con Vue?"
difficulty: "advanced"
tags: ["architecture"]
---

Los micro-frontends dividen un frontend grande en apps independientes que se desarrollan, despliegan y ejecutan por separado. Cada equipo es propietario de una funcionalidad y la publica sin coordinar releases con otros. En Vue, los enfoques principales son Module Federation, Web Components y composición basada en iframes.

## Module Federation (Vite/Webpack)

Module Federation permite que una app cargue componentes de otra en tiempo de ejecución. Cada micro-frontend es una build separada de Vite/Webpack que expone módulos específicos.

**App remota** (el micro-frontend que expone componentes):

```ts
// vite.config.ts (remoto: checkout-app)
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

**App anfitriona** (el shell que consume los micro-frontends):

```ts
// vite.config.ts (anfitrión: shell-app)
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
<!-- En la app shell -->
<script setup>
import CheckoutForm from 'checkout/CheckoutForm'
</script>

<template>
  <CheckoutForm />
</template>
```

La configuración `shared` garantiza que ambas apps usen la misma instancia de Vue, de modo que la reactividad y provide/inject funcionan entre límites.

## Enfoque con Web Components

Cada micro-frontend se publica como un custom element. La app shell no necesita saber que es Vue:

**Micro-frontend:**

```ts
// checkout-element/main.ts
import { defineCustomElement } from 'vue'
import CheckoutForm from './CheckoutForm.ce.vue'

const CheckoutElement = defineCustomElement(CheckoutForm)
customElements.define('checkout-form', CheckoutElement)
```

**App shell (cualquier framework, o HTML puro):**

```vue
<template>
  <checkout-form :cart-id="cartId" @order-placed="handleOrder" />
</template>
```

Ventajas: agnóstico al framework, aislamiento real. Desventajas: sin contexto Vue compartido (provide/inject, devtools), el aislamiento CSS puede ser complicado.

## Comunicación entre micro-frontends

Los micro-frontends están aislados, por lo que necesitan canales de comunicación explícitos:

**Eventos personalizados (poco acoplados):**

```ts
// Micro-frontend A despacha
window.dispatchEvent(new CustomEvent('cart:updated', {
  detail: { itemCount: 3 }
}))

// Micro-frontend B escucha
window.addEventListener('cart:updated', (e: CustomEvent) => {
  badgeCount.value = e.detail.itemCount
})
```

**Bus de eventos compartido:**

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

**Store de Pinia compartido (solo con Module Federation):**

Si ambas apps comparten las mismas instancias de Vue y Pinia mediante Module Federation, pueden usar el mismo store directamente. Es más sencillo pero acopla más los micro-frontends entre sí.

## Estructura de directorios

```
apps/
├── shell/               ← app anfitriona (enrutamiento, layout, navegación)
│   ├── src/
│   │   ├── App.vue
│   │   └── router/
│   └── vite.config.ts
├── checkout/            ← micro-frontend (equipo de checkout)
│   ├── src/
│   │   ├── components/
│   │   └── stores/
│   └── vite.config.ts
├── catalog/             ← micro-frontend (equipo de catálogo)
│   ├── src/
│   └── vite.config.ts
└── shared/              ← tipos compartidos, bus de eventos, design tokens
    ├── types/
    └── event-bus.ts
```

## Cuándo usar micro-frontends

| Situación | ¿Usar micro-frontends? |
|---|---|
| Múltiples equipos trabajando en funcionalidades separadas de forma independiente | Sí |
| Necesidad de desplegar funcionalidades sin publicar toda la app | Sí |
| Un solo equipo, app de tamaño mediano | No, usa un monolito con buena arquitectura |
| El rendimiento es crítico (overhead mínimo) | Probablemente no, añade complejidad de carga |
| Mezclar Vue con React o Angular en la misma página | Sí, con el enfoque de Web Components |

## Ventajas e inconvenientes

Los micro-frontends añaden complejidad: gestión de dependencias compartidas, comunicación entre apps, coordinación del enrutamiento, sistema de diseño consistente y orquestación de despliegues. Para la mayoría de los equipos, un monolito bien estructurado con rutas cargadas de forma diferida y límites de módulos claros es más sencillo y rinde mejor. Los micro-frontends tienen sentido cuando el escalado organizativo (muchos equipos, despliegues independientes) supera el coste técnico.
