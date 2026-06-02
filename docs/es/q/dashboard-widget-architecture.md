---
order: 138
title: "¿Cómo arquitectarías un dashboard con múltiples widgets que cada uno obtiene sus propios datos?"
difficulty: "advanced"
tags: ["architecture", "composables", "performance", "pinia", "provide-inject", "suspense"]
summary: "Cada widget es un componente independiente con su propio composable de datos. Los datos compartidos van en Pinia; los del widget en refs locales."
---

Cada widget debe ser un componente independiente con su propio composable para la obtención de datos. Cada widget gestiona sus propios estados de carga, error y datos, de modo que una API lenta no bloquea a las otras cuatro. Los datos compartidos van en un store de Pinia; los datos exclusivos del widget permanecen en los refs locales del composable. El layout usa CSS Grid para que los widgets sean celdas responsivas que se renderizan de forma independiente.

## Estructura de componentes

```
DashboardPage.vue
├── SalesWidget.vue        → useSalesWidget()
├── ActivityFeed.vue       → useActivityFeed()
├── PerformanceChart.vue   → usePerformanceChart()
├── RecentOrders.vue       → useRecentOrders()
└── UserStats.vue          → useUserStats()
```

Cada widget es autocontenido. La página del dashboard solo los organiza en una cuadrícula.

## Composable de fetch genérico

Empieza con una base reutilizable que todos los composables de widgets puedan usar:

```ts
// composables/useFetchData.ts
export function useFetchData<T>(url: MaybeRefOrGetter<string>) {
  const data = shallowRef<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(toValue(url))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  execute()

  return { data, error, isLoading, refresh: execute }
}
```

`shallowRef` es intencional aquí. Los datos de los widgets normalmente se reemplazan por completo (nueva respuesta de la API), no se mutan en profundidad. Evitar la reactividad profunda en objetos grandes reduce la sobrecarga.

## Composable específico del widget

```ts
// composables/useSalesWidget.ts
interface SalesData {
  totalRevenue: number
  ordersToday: number
  topProduct: string
}

export function useSalesWidget() {
  const { data, error, isLoading, refresh } = useFetchData<SalesData>('/api/dashboard/sales')

  const formattedRevenue = computed(() => {
    if (!data.value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD'
    }).format(data.value.totalRevenue)
  })

  return { data, error, isLoading, refresh, formattedRevenue }
}
```

La lógica específica del widget (formateo, valores derivados) vive en el composable del widget, no en el `useFetchData` genérico.

## Componente widget

```vue
<!-- SalesWidget.vue -->
<script setup>
const { data, error, isLoading, formattedRevenue, refresh } = useSalesWidget()
</script>

<template>
  <div class="widget">
    <div class="widget-header">
      <h3>Sales</h3>
      <button @click="refresh">Refresh</button>
    </div>

    <div v-if="isLoading" class="skeleton" />

    <div v-else-if="error" class="widget-error">
      <p>Failed to load sales data</p>
      <button @click="refresh">Retry</button>
    </div>

    <div v-else-if="data">
      <p class="metric">{{ formattedRevenue }}</p>
      <p>{{ data.ordersToday }} orders today</p>
      <p>Top: {{ data.topProduct }}</p>
    </div>
  </div>
</template>
```

Cada widget gestiona sus propios tres estados (carga, error, datos) de forma independiente.

## Layout del dashboard

```vue
<!-- DashboardPage.vue -->
<template>
  <div class="dashboard-grid">
    <SalesWidget />
    <ActivityFeed />
    <PerformanceChart />
    <RecentOrders />
    <UserStats />
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
</style>
```

El componente de página no tiene lógica de obtención de datos. Solo define el layout. Cada widget aparece a medida que carga, independientemente de los demás.

## Datos compartidos: store de Pinia

Si varios widgets necesitan los mismos datos (usuario actual, configuración de empresa, filtros compartidos), ponlos en un store en lugar de obtenerlos en cada widget:

```ts
// stores/dashboard.ts
export const useDashboardStore = defineStore('dashboard', () => {
  const dateRange = ref({ from: startOfWeek(), to: new Date() })
  const currentUser = ref<User | null>(null)

  async function loadUser() {
    currentUser.value = await fetch('/api/me').then(r => r.json())
  }

  return { dateRange, currentUser, loadUser }
})
```

```ts
// composables/useSalesWidget.ts
export function useSalesWidget() {
  const store = useDashboardStore()

  const url = computed(
    () => `/api/dashboard/sales?from=${store.dateRange.from.toISOString()}&to=${store.dateRange.to.toISOString()}`
  )

  const { data, error, isLoading, refresh } = useFetchData<SalesData>(url)

  return { data, error, isLoading, refresh }
}
```

Cuando el usuario cambia el rango de fechas en el store, cada widget que depende de él vuelve a obtener datos automáticamente a través de la URL computed.

## Mantener los datos actualizados

Los widgets necesitan una estrategia de refresco. Tres opciones según el caso de uso:

```ts
// Opción 1: Botón de refresco manual (mostrado arriba)

// Opción 2: Intervalo de polling
export function useSalesWidget() {
  const { data, error, isLoading, refresh } = useFetchData<SalesData>('/api/dashboard/sales')

  const interval = setInterval(refresh, 30_000)
  onUnmounted(() => clearInterval(interval))

  return { data, error, isLoading, refresh }
}

// Opción 3: WebSocket para actualizaciones en tiempo real
export function useActivityFeed() {
  const activities = ref<Activity[]>([])

  const ws = new WebSocket('wss://api.example.com/activity')
  ws.onmessage = (event) => {
    activities.value.unshift(JSON.parse(event.data))
  }
  onUnmounted(() => ws.close())

  return { activities }
}
```

## Alternativa con Suspense

En lugar de que cada widget gestione su propio estado de carga, puedes usar `Suspense` con setup asíncrono:

```vue
<!-- DashboardPage.vue -->
<template>
  <div class="dashboard-grid">
    <Suspense v-for="Widget in widgets" :key="Widget.name">
      <component :is="Widget" />
      <template #fallback>
        <WidgetSkeleton />
      </template>
    </Suspense>
  </div>
</template>
```

Cada límite `Suspense` es independiente, por lo que los widgets siguen cargando a su propio ritmo. El skeleton se muestra mientras el setup asíncrono se resuelve.

## Resumen de decisiones de arquitectura

| Decisión | Datos solo del widget | Datos compartidos |
|---|---|---|
| Dónde vive | Ref local del composable | Store de Pinia |
| Quién obtiene | Composable del widget | Acción del store |
| Profundidad de reactividad | `shallowRef` (reemplazado completo) | `ref` o `shallowRef` |
| Estrategia de refresco | Por widget (poll, manual, WebSocket) | La acción del store activa todos los dependientes |
| Manejo de errores | Por widget (estado de error local) | A nivel de store o por widget |

Ver también: [¿Qué son los componentes asíncronos?](/es/q/async-components) · [¿Cómo funciona provide/inject?](/es/q/provide-inject) · [¿Qué son los componentes dinámicos y KeepAlive?](/es/q/dynamic-components-keepalive)

## Referencias

- [defineAsyncComponent()](https://vuejs.org/api/general.html#defineasynccomponent) - Vue.js docs
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
- [Dynamic Components](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components) - Vue.js docs
