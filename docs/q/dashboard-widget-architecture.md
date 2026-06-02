---
order: 140
title: "How would you architect a dashboard with multiple widgets that each fetch their own data?"
difficulty: "advanced"
tags: ["architecture", "composables", "performance"]
---

Each widget should be an independent component with its own composable for data fetching. Every widget manages its own loading, error, and data state so one slow API doesn't block the other four. Shared data goes in a Pinia store; widget-only data stays in the composable's local refs. The layout uses CSS Grid so widgets are responsive grid cells that render independently.

## Component structure

```
DashboardPage.vue
├── SalesWidget.vue        → useSalesWidget()
├── ActivityFeed.vue       → useActivityFeed()
├── PerformanceChart.vue   → usePerformanceChart()
├── RecentOrders.vue       → useRecentOrders()
└── UserStats.vue          → useUserStats()
```

Each widget is self-contained. The dashboard page just arranges them in a grid.

## Generic fetch composable

Start with a reusable base that all widget composables can use:

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

`shallowRef` is intentional here. Widget data is typically replaced wholesale (new API response), not deeply mutated. Avoiding deep reactivity on large objects saves overhead.

## Widget-specific composable

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

Widget-specific logic (formatting, derived values) lives in the widget composable, not in the generic `useFetchData`.

## Widget component

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

Each widget handles its own three states (loading, error, data) independently.

## Dashboard layout

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

The page component has no data fetching logic. It just defines the layout. Each widget appears as it loads, independently of the others.

## Shared data: Pinia store

If multiple widgets need the same data (current user, company settings, shared filters), put it in a store instead of fetching it in each widget:

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

When the user changes the date range in the store, every widget that depends on it re-fetches automatically through the computed URL.

## Keeping data fresh

Widgets need a refresh strategy. Three options depending on the use case:

```ts
// Option 1: Manual refresh button (shown above)

// Option 2: Polling interval
export function useSalesWidget() {
  const { data, error, isLoading, refresh } = useFetchData<SalesData>('/api/dashboard/sales')

  const interval = setInterval(refresh, 30_000)
  onUnmounted(() => clearInterval(interval))

  return { data, error, isLoading, refresh }
}

// Option 3: WebSocket for real-time updates
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

## Suspense alternative

Instead of each widget managing its own loading state, you can use `Suspense` with async setup:

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

Each `Suspense` boundary is independent, so widgets still load at their own pace. The skeleton shows while the async setup resolves.

## Architecture decisions summary

| Decision | Widget-only data | Shared data |
|---|---|---|
| Where it lives | Composable local ref | Pinia store |
| Who fetches | Widget composable | Store action |
| Reactivity depth | `shallowRef` (replaced wholesale) | `ref` or `shallowRef` |
| Refresh strategy | Per-widget (poll, manual, WebSocket) | Store action triggers all dependents |
| Error handling | Per-widget (local error state) | Store-level or per-widget |

See also: [What are async components?](/q/async-components) · [How does provide/inject work?](/q/provide-inject) · [What are dynamic components and KeepAlive?](/q/dynamic-components-keepalive)

## References

- [defineAsyncComponent()](https://vuejs.org/api/general.html#defineasynccomponent) - Vue.js docs
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
- [Dynamic Components](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components) - Vue.js docs
