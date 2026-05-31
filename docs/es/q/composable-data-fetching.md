---
order: 16
title: "¿Cómo construirías un composable para peticiones de datos?"
difficulty: "intermediate"
tags: ["composables"]
---

```ts
import { ref, watchEffect, type Ref } from 'vue'

export function useFetch<T>(url: string | Ref<string>) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      const urlValue = typeof url === 'string' ? url : url.value
      const response = await fetch(urlValue)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  // Si la url es reactiva, vuelve a hacer la petición cuando cambie
  if (typeof url !== 'string') {
    watchEffect(() => { execute() })
  } else {
    execute()
  }

  return { data, error, loading, refetch: execute }
}
```
