---
order: 25
title: "How would you test a composable that fetches data?"
difficulty: "advanced"
---

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFetch } from '../useFetch'
import { flushPromises } from '@vue/test-utils'

// Mock global fetch
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
