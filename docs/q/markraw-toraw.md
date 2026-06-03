---
order: 83
title: 'When should you use markRaw and toRaw?'
difficulty: 'advanced'
tags: ['reactivity', 'performance']
summary: 'markRaw prevents an object from becoming reactive (for libraries, DOM elements, static data). toRaw returns the original object behind a reactive Proxy.'
---

[markRaw](https://vuejs.org/api/reactivity-advanced.html#markraw) tells Vue to never wrap an object in a reactive [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). [toRaw](https://vuejs.org/api/reactivity-advanced.html#toraw) returns the original object behind an existing Proxy. Both exist because not everything belongs inside the reactivity system.

## markRaw: prevent an object from becoming reactive

When you store a third-party library instance, a DOM element, or a large static dataset inside reactive state, Vue wraps it in a Proxy. This causes problems: library internals can break, identity checks fail, and you pay tracking overhead for data that will never trigger a re-render.

```ts
import { reactive, markRaw } from 'vue'
import mapboxgl from 'mapbox-gl'

// Wrong: Mapbox instance gets proxied, internal methods may break
const state = reactive({
  map: new mapboxgl.Map({ container: 'map' })
})

// Right: markRaw prevents proxy wrapping
const state = reactive({
  map: markRaw(new mapboxgl.Map({ container: 'map' }))
})
```

### Common candidates for markRaw

```ts
// Library instances (charts, editors, maps)
const editor = markRaw(monaco.editor.create(element, {}))

// Class instances with internal state
const ws = markRaw(new WebSocketManager('ws://example.com'))

// Large static datasets that never change
const geoData = markRaw(await fetch('/huge.json').then((r) => r.json()))

// DOM elements stored in reactive state
const el = markRaw(document.getElementById('canvas')!)
```

### Best pattern: shallowRef + markRaw

[shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref) only tracks `.value` reassignment (not deep properties), and `markRaw` prevents the assigned object from being proxied:

```ts
import { shallowRef, markRaw, onMounted, onUnmounted } from 'vue'

function useChart(containerId: string) {
  const chart = shallowRef<Chart | null>(null)

  onMounted(() => {
    chart.value = markRaw(
      new Chart(containerId, {
        /* config */
      })
    )
  })

  onUnmounted(() => {
    chart.value?.destroy()
  })

  return { chart }
}
```

## toRaw: access the original object behind a Proxy

`toRaw` strips the reactive Proxy and returns the underlying plain object. Use it when you need to pass data to something that shouldn't receive a Proxy (APIs, libraries, structured clone, comparison).

```ts
import { reactive, toRaw } from 'vue'

const state = reactive({ name: 'Ana', age: 30 })

// Send plain data to an API (no Proxy in the payload)
await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(toRaw(state))
})

// structuredClone needs plain objects
const snapshot = structuredClone(toRaw(state))

// Identity comparison
const raw = toRaw(state)
console.log(raw === state) // false (state is a Proxy)
```

## markRaw vs toRaw

|                     | `markRaw`                          | `toRaw`                                 |
| ------------------- | ---------------------------------- | --------------------------------------- |
| When to use         | Before storing in reactive state   | After something is already reactive     |
| What it does        | Marks object so it's never proxied | Returns the plain object behind a Proxy |
| Permanent?          | Yes, the mark stays on the object  | No, it just unwraps once                |
| Mutates the object? | Adds a `__v_skip` flag             | No                                      |

## Gotcha: markRaw is shallow

`markRaw` only prevents the root object from being proxied. Nested objects can still be wrapped if accessed through a reactive parent:

```ts
const data = markRaw({ nested: { value: 1 } })

const state = reactive({ data })
// state.data won't be proxied
// but state.data.nested might be in some edge cases

// Safer: combine with shallowRef
const safeData = shallowRef(markRaw(data))
```

See also: [What happens when you use Object.freeze() on reactive data?](/q/object-freeze-reactive) · [What is the reactivity proxy identity hazard?](/q/proxy-identity-hazard)

## References

- [markRaw() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#markraw)
- [toRaw() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#toraw)
- [shallowRef() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#shallowref)
