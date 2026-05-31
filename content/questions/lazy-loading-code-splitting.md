---
order: 30
title: "How would you implement lazy loading and code splitting?"
difficulty: "advanced"
---

```ts
// Lazy loaded routes
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue')
  }
]

// Async component with loading/error states
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent({
  loader: () => import('./components/HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,    // ms before showing loading
  timeout: 10000 // ms before showing error
})
```

**Vite automatically** does code splitting on dynamic imports. Each `() => import(...)` becomes a separate chunk.
