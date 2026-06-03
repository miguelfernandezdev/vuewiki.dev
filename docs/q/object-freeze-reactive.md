---
order: 76
title: 'What happens when you use Object.freeze() on reactive data?'
difficulty: 'intermediate'
tags: ['reactivity']
summary: "Vue can't make frozen objects reactive because Proxy set traps silently fail. Useful as a performance optimization for large, read-only datasets."
---

Vue cannot make a frozen object reactive. `Object.freeze()` prevents property modifications at the JavaScript engine level, so Vue's [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) traps for `set` and `deleteProperty` silently fail. The object renders once with its initial values, but mutations won't trigger updates. This is actually useful as a performance optimization for large datasets that never change.

## What happens step by step

```vue
<script setup>
const frozenList = reactive(
  Object.freeze([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
)
</script>

<template>
  <!-- Renders fine on first load -->
  <p v-for="item in frozenList" :key="item.id">
    {{ item.name }}
  </p>

  <!-- This button does nothing visible -->
  <button @click="frozenList[0].name = 'Changed'">Try to mutate</button>
</template>
```

<PlaygroundLink code="<script setup>
const frozenList = reactive(
  Object.freeze([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
)
</script>
&#10;<template>
&#10;  <p v-for=&quot;item in frozenList&quot; :key=&quot;item.id&quot;>
    {{ item.name }}
  </p>
&#10;  <button @click=&quot;frozenList[0].name = 'Changed'&quot;>Try to mutate</button>
</template>" />

Clicking the button won't update the DOM. In strict mode, the mutation throws a `TypeError`. In non-strict mode, it silently fails. Either way, Vue never re-renders.

## Why: Proxy vs freeze

Vue 3's reactivity wraps objects in a Proxy. The Proxy intercepts `get` and `set` operations to track dependencies and trigger updates. But `Object.freeze()` uses `Object.defineProperty` to set `writable: false` and `configurable: false` on every property. When the Proxy's `set` trap tries to forward the write to the frozen target, JavaScript itself blocks it:

```ts
const original = Object.freeze({ count: 0 })
const proxy = new Proxy(original, {
  set(target, key, value) {
    target[key] = value // TypeError in strict mode
    return true
  }
})

proxy.count = 1 // fails
```

Vue detects frozen objects and skips making their properties reactive, which is why it works as a performance optimization.

## Performance optimization for static data

When you have large arrays of data that are read-only (reference tables, configuration, map coordinates), freezing them skips the overhead of creating reactive Proxies for every nested property:

```vue
<script setup>
import { shallowRef } from 'vue'

const countries = shallowRef(
  Object.freeze(
    await $fetch('/api/countries') // 250 objects with nested properties
  )
)
</script>

<template>
  <select>
    <option v-for="c in countries" :key="c.code" :value="c.code">
      {{ c.name }}
    </option>
  </select>
</template>
```

<PlaygroundLink code="<script setup>
import { shallowRef } from 'vue'
&#10;const countries = shallowRef(
  Object.freeze(
    await $fetch('/api/countries') // 250 objects with nested properties
  )
)
</script>
&#10;<template>
  <select>
    <option v-for=&quot;c in countries&quot; :key=&quot;c.code&quot; :value=&quot;c.code&quot;>
      {{ c.name }}
    </option>
  </select>
</template>" />

Combining [shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref) with `Object.freeze` means Vue tracks the ref itself (you can replace the entire array) but doesn't create Proxies for the 250 country objects or their nested properties.

## Replacing frozen data

You can't mutate the frozen object, but you can replace the entire reference:

```vue
<script setup>
const data = ref(Object.freeze([1, 2, 3]))

function addItem() {
  // BAD: data.value.push(4) — fails silently or throws
  // GOOD: replace with a new frozen array
  data.value = Object.freeze([...data.value, 4])
}
</script>
```

<PlaygroundLink code="<script setup>
const data = ref(Object.freeze([1, 2, 3]))
&#10;function addItem() {
  // BAD: data.value.push(4) — fails silently or throws
  // GOOD: replace with a new frozen array
  data.value = Object.freeze([...data.value, 4])
}
</script>" />

The ref's `.value` is reassignable. Vue detects the new value and re-renders. The new array is also frozen, so its contents stay non-reactive.

## markRaw as an alternative

`markRaw` tells Vue to never make an object reactive, without the immutability constraint of `freeze`:

```ts
import { markRaw } from 'vue'

const map = markRaw(new Map())
map.set('key', 'value') // works, but Vue won't track it

const chartInstance = markRaw(new Chart(canvas, config))
```

|                     | `Object.freeze`            | `markRaw`                                     |
| ------------------- | -------------------------- | --------------------------------------------- |
| Prevents reactivity | Yes                        | Yes                                           |
| Prevents mutation   | Yes                        | No                                            |
| Use case            | Static data, lookup tables | Third-party objects (Chart.js, maps, editors) |
| Nested objects      | Must freeze recursively    | Applies only to the top level                 |

See also: [When should you use markRaw and toRaw?](/q/markraw-toraw) · [When would you use shallowRef / shallowReactive?](/q/shallow-ref-reactive)

## References

- [shallowRef() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#shallowref)
- [markRaw() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#markraw)
- [Proxy - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
