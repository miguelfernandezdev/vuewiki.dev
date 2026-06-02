---
order: 117
title: "¿Cómo testearías un composable que hace fetch de datos?"
difficulty: "advanced"
tags: ["testing", "composables", "vitest", "vueuse"]
---

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFetch } from '../useFetch'
import { flushPromises } from '@vue/test-utils'

// Mock del fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useFetch', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('fetches data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: 'John' })
    })

    const { data, loading, error } = useFetch('/api/user')

    expect(loading.value).toBe(true)
    await flushPromises()

    expect(loading.value).toBe(false)
    expect(data.value).toEqual({ name: 'John' })
    expect(error.value).toBeNull()
  })

  it('handles errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const { data, error } = useFetch('/api/missing')
    await flushPromises()

    expect(data.value).toBeNull()
    expect(error.value).toContain('404')
  })
})
```

Ver también: [¿Cómo construirías un composable para data fetching?](/es/q/composable-data-fetching) · [¿Cómo testear un composable con fake timers?](/es/q/test-composable-fake-timers)

## Referencias

- [Testing Composables](https://vuejs.org/guide/reusability/composables.html#testing-composables) - Vue.js docs
- [vi.fn](https://vitest.dev/api/vi.html#vi-fn) - Vitest docs
