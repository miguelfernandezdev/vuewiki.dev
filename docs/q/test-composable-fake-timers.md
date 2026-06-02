---
order: 118
title: "How do you test a composable that uses setTimeout?"
difficulty: "advanced"
tags: ["testing", "composables", "pinia", "vitest", "watchers"]
---

Use Vitest's fake timers (`vi.useFakeTimers`) to control time, and Vue's `nextTick` to flush reactive updates between steps. The pattern is: activate fake timers, call the composable, change reactive state, `await nextTick()` to let Vue's watcher run, then `vi.advanceTimersByTime()` to trigger the timeout. Without `nextTick`, the watcher that starts the timer never fires. Without fake timers, the test has to wait real time.

## The composable under test

A debounced search composable that delays updating the output until the user stops typing:

```ts
// composables/useDebounceSearch.ts
import { ref, watch } from 'vue'

export function useDebounceSearch(delay: number = 300) {
  const query = ref('')
  const debouncedQuery = ref('')
  let timer: ReturnType<typeof setTimeout>

  watch(query, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedQuery.value = query.value
    }, delay)
  })

  return { query, debouncedQuery }
}
```

When `query` changes, a watcher starts a `setTimeout`. If `query` changes again before the delay expires, the previous timeout is cleared and a new one starts. `debouncedQuery` only updates after the user stops typing for `delay` milliseconds.

## The test

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useDebounceSearch } from './useDebounceSearch'

describe('useDebounceSearch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('updates debouncedQuery after the delay', async () => {
    const { query, debouncedQuery } = useDebounceSearch(300)

    query.value = 'hello'
    await nextTick()              // flush the watcher (starts setTimeout)
    vi.advanceTimersByTime(300)   // fast-forward 300ms

    expect(debouncedQuery.value).toBe('hello')
  })

  it('resets the timer on rapid input', async () => {
    const { query, debouncedQuery } = useDebounceSearch(300)

    query.value = 'h'
    await nextTick()
    vi.advanceTimersByTime(100)   // 100ms passed

    query.value = 'he'
    await nextTick()
    vi.advanceTimersByTime(100)   // 200ms total, timer restarted at 100ms

    query.value = 'hel'
    await nextTick()
    vi.advanceTimersByTime(100)   // 300ms total, timer restarted at 200ms

    expect(debouncedQuery.value).toBe('')  // not enough time since last change

    vi.advanceTimersByTime(200)   // 500ms total, 300ms since last change

    expect(debouncedQuery.value).toBe('hel')
  })

  it('does not update before the delay', async () => {
    const { query, debouncedQuery } = useDebounceSearch(300)

    query.value = 'test'
    await nextTick()
    vi.advanceTimersByTime(299)

    expect(debouncedQuery.value).toBe('')  // 1ms short
  })
})
```

## Why both nextTick and advanceTimersByTime

Two different scheduling systems are at play:

1. **Vue's reactivity scheduler**: when `query.value` changes, the watcher callback is queued as a microtask. `await nextTick()` flushes that queue, which executes the watcher, which calls `setTimeout`.

2. **The browser's timer queue**: `setTimeout` schedules a callback in the macro task queue. `vi.advanceTimersByTime(300)` fast-forwards fake time and executes any timers whose delay has passed.

Without `nextTick`, the watcher hasn't run yet when you advance timers, so there's no `setTimeout` to trigger. Without `advanceTimersByTime`, the `setTimeout` callback never fires because fake timers freeze time.

```
query.value = 'hello'
  → Vue queues the watcher (microtask)

await nextTick()
  → Watcher runs → calls setTimeout(fn, 300)

vi.advanceTimersByTime(300)
  → setTimeout callback runs → debouncedQuery.value = 'hello'
```

## Testing composables with setInterval

The same pattern works for polling or repeating timers:

```ts
// composables/usePolling.ts
export function usePolling(callback: () => void, interval: number) {
  const isActive = ref(false)
  let timer: ReturnType<typeof setInterval>

  function start() {
    isActive.value = true
    timer = setInterval(callback, interval)
  }

  function stop() {
    isActive.value = false
    clearInterval(timer)
  }

  onUnmounted(stop)

  return { isActive, start, stop }
}
```

```ts
it('calls the callback at each interval', () => {
  const callback = vi.fn()
  const { start } = usePolling(callback, 1000)

  start()

  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalledTimes(1)

  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalledTimes(2)

  vi.advanceTimersByTime(3000)
  expect(callback).toHaveBeenCalledTimes(5)
})
```

No `nextTick` needed here because `start()` is called directly (no reactive watcher involved). The `setInterval` is created synchronously.

## Cleanup matters

Always restore real timers in `afterEach`:

```ts
afterEach(() => vi.useRealTimers())
```

If you forget, fake timers leak into other tests. Promises that depend on real time (like `flushPromises`) will hang, and unrelated tests will fail in confusing ways.

## Quick reference

| Step | What it does | When needed |
|---|---|---|
| `vi.useFakeTimers()` | Replaces setTimeout/setInterval with fakes | Before any test using timers |
| `await nextTick()` | Flushes Vue's reactivity queue | After changing reactive state, before advancing time |
| `vi.advanceTimersByTime(ms)` | Fast-forwards fake time | To trigger setTimeout/setInterval callbacks |
| `vi.runAllTimers()` | Runs all pending timers immediately | When you don't care about specific timing |
| `vi.useRealTimers()` | Restores real timer functions | In afterEach, always |

See also: [How do you test a Pinia store?](/q/test-pinia-store) · [How do you test a composable that uses fetch?](/q/testing-composable-fetch)

## References

- [vi.useFakeTimers](https://vitest.dev/api/vi.html#vi-usefaketimers) - Vitest docs
- [Testing Composables](https://vuejs.org/guide/reusability/composables.html#testing-composables) - Vue.js docs
