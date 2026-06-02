---
order: 154
title: "¿Cómo se prueba un composable que usa setTimeout?"
difficulty: "advanced"
tags: ["testing", "composables", "pinia", "vitest", "watchers"]
---

Usa los timers falsos de Vitest (`vi.useFakeTimers`) para controlar el tiempo, y el `nextTick` de Vue para vaciar las actualizaciones reactivas entre pasos. El patrón es: activa los timers falsos, llama al composable, cambia el estado reactivo, `await nextTick()` para que se ejecute el watcher de Vue, y luego `vi.advanceTimersByTime()` para disparar el timeout. Sin `nextTick`, el watcher que inicia el timer nunca se ejecuta. Sin los timers falsos, el test tiene que esperar tiempo real.

## El composable bajo prueba

Un composable de búsqueda con debounce que retrasa la actualización de la salida hasta que el usuario deja de escribir:

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

Cuando `query` cambia, un watcher inicia un `setTimeout`. Si `query` vuelve a cambiar antes de que expire el retraso, el timeout anterior se cancela y se inicia uno nuevo. `debouncedQuery` solo se actualiza después de que el usuario deje de escribir durante `delay` milisegundos.

## El test

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useDebounceSearch } from './useDebounceSearch'

describe('useDebounceSearch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('actualiza debouncedQuery después del retraso', async () => {
    const { query, debouncedQuery } = useDebounceSearch(300)

    query.value = 'hello'
    await nextTick()              // vacía el watcher (inicia setTimeout)
    vi.advanceTimersByTime(300)   // avanza 300ms

    expect(debouncedQuery.value).toBe('hello')
  })

  it('reinicia el timer con entrada rápida', async () => {
    const { query, debouncedQuery } = useDebounceSearch(300)

    query.value = 'h'
    await nextTick()
    vi.advanceTimersByTime(100)   // 100ms transcurridos

    query.value = 'he'
    await nextTick()
    vi.advanceTimersByTime(100)   // 200ms totales, timer reiniciado a 100ms

    query.value = 'hel'
    await nextTick()
    vi.advanceTimersByTime(100)   // 300ms totales, timer reiniciado a 200ms

    expect(debouncedQuery.value).toBe('')  // no ha pasado suficiente tiempo desde el último cambio

    vi.advanceTimersByTime(200)   // 500ms totales, 300ms desde el último cambio

    expect(debouncedQuery.value).toBe('hel')
  })

  it('no actualiza antes del retraso', async () => {
    const { query, debouncedQuery } = useDebounceSearch(300)

    query.value = 'test'
    await nextTick()
    vi.advanceTimersByTime(299)

    expect(debouncedQuery.value).toBe('')  // 1ms de diferencia
  })
})
```

## Por qué se necesitan nextTick y advanceTimersByTime

Hay dos sistemas de planificación distintos en juego:

1. **El planificador de reactividad de Vue**: cuando `query.value` cambia, el callback del watcher se pone en cola como una microtarea. `await nextTick()` vacía esa cola, lo que ejecuta el watcher, que llama a `setTimeout`.

2. **La cola de timers del navegador**: `setTimeout` planifica un callback en la cola de macrotareas. `vi.advanceTimersByTime(300)` avanza el tiempo falso y ejecuta los timers cuyo retraso ha expirado.

Sin `nextTick`, el watcher no se ha ejecutado todavía cuando avanzas los timers, así que no hay ningún `setTimeout` que disparar. Sin `advanceTimersByTime`, el callback del `setTimeout` nunca se ejecuta porque los timers falsos congelan el tiempo.

```
query.value = 'hello'
  → Vue pone el watcher en cola (microtarea)

await nextTick()
  → El watcher se ejecuta → llama a setTimeout(fn, 300)

vi.advanceTimersByTime(300)
  → El callback de setTimeout se ejecuta → debouncedQuery.value = 'hello'
```

## Probar composables con setInterval

El mismo patrón funciona para polling o timers repetitivos:

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
it('llama al callback en cada intervalo', () => {
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

No se necesita `nextTick` aquí porque `start()` se llama directamente (no hay watcher reactivo de por medio). El `setInterval` se crea de forma síncrona.

## La limpieza importa

Restaura siempre los timers reales en `afterEach`:

```ts
afterEach(() => vi.useRealTimers())
```

Si lo olvidas, los timers falsos se filtran a otros tests. Las promesas que dependen del tiempo real (como `flushPromises`) se quedarán bloqueadas, y tests no relacionados fallarán de formas confusas.

## Referencia rápida

| Paso | Qué hace | Cuándo se necesita |
|---|---|---|
| `vi.useFakeTimers()` | Reemplaza setTimeout/setInterval por versiones falsas | Antes de cualquier test que use timers |
| `await nextTick()` | Vacía la cola de reactividad de Vue | Después de cambiar estado reactivo, antes de avanzar el tiempo |
| `vi.advanceTimersByTime(ms)` | Avanza el tiempo falso | Para disparar callbacks de setTimeout/setInterval |
| `vi.runAllTimers()` | Ejecuta todos los timers pendientes inmediatamente | Cuando no importa el timing específico |
| `vi.useRealTimers()` | Restaura las funciones de timer reales | En afterEach, siempre |

Ver también: [¿Cómo testear un store de Pinia?](/es/q/test-pinia-store) · [¿Cómo testear un composable que usa fetch?](/es/q/testing-composable-fetch)

## Referencias

- [vi.useFakeTimers](https://vitest.dev/api/vi.html#vi-usefaketimers) - Vitest docs
- [Testing Composables](https://vuejs.org/guide/reusability/composables.html#testing-composables) - Vue.js docs
