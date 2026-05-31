---
order: 30
title: "¿Cómo implementarías lazy loading y code splitting?"
difficulty: "advanced"
tags: ["performance", "vue-router"]
---

```ts
// Rutas con carga diferida
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue')
  }
]

// Componente asíncrono con estados de carga y error
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent({
  loader: () => import('./components/HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,    // ms before showing loading
  timeout: 10000 // ms before showing error
})
```

**Vite automáticamente** hace code splitting en los imports dinámicos. Cada `() => import(...)` se convierte en un chunk separado.
