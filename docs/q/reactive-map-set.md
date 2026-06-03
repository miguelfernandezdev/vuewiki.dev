---
order: 89
title: 'How do reactive Maps and Sets work in Vue 3?'
difficulty: 'advanced'
tags: ['reactivity', 'watchers']
summary: 'reactive() supports Map, Set, WeakMap, and WeakSet natively. Vue intercepts collection methods (get, set, add, delete) for automatic tracking.'
---

Vue 3's [reactive()](https://vuejs.org/api/reactivity-core.html#reactive) supports `Map`, `Set`, `WeakMap`, and `WeakSet` out of the box. The [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) intercepts collection methods like `get`, `set`, `add`, `delete`, `has`, and `forEach`, tracking reads and triggering updates on writes. You use the standard JavaScript API, and Vue handles reactivity transparently. You can use either `reactive()` or `ref()`; both work. With `reactive()` you interact with the collection directly; with `ref()` you access it through `.value`.

## Basic usage

```vue
<script setup>
const tags = reactive(new Set<string>())
const scores = reactive(new Map<string, number>())

function addTag(tag: string) {
  tags.add(tag)
}

function setScore(name: string, score: number) {
  scores.set(name, score)
}
</script>

<template>
  <div>
    <button @click="addTag('vue')">Add tag</button>
    <span v-for="tag in tags" :key="tag">{{ tag }}</span>
  </div>

  <div>
    <button @click="setScore('Alice', 95)">Set score</button>
    <div v-for="[name, score] in scores" :key="name">
      {{ name }}: {{ score }}
    </div>
  </div>
</template>
```

<PlaygroundLink code="<script setup>
const tags = reactive(new Set<string>())
const scores = reactive(new Map<string, number>())
&#10;function addTag(tag: string) {
tags.add(tag)
}
&#10;function setScore(name: string, score: number) {
scores.set(name, score)
}
</script>
&#10;<template>

  <div>
    <button @click=&quot;addTag('vue')&quot;>Add tag</button>
    <span v-for=&quot;tag in tags&quot; :key=&quot;tag&quot;>{{ tag }}</span>
  </div>
&#10;  <div>
    <button @click=&quot;setScore('Alice', 95)&quot;>Set score</button>
    <div v-for=&quot;[name, score] in scores&quot; :key=&quot;name&quot;>
      {{ name }}: {{ score }}
    </div>
  </div>
</template>" />

`v-for` works directly on `Map` and `Set` because Vue iterates them just like arrays. For a `Map`, each entry destructures as `[key, value]`.

## Which methods are tracked

Vue intercepts these operations:

| Operation                      | Tracked (read)    | Triggers update (write) |
| ------------------------------ | ----------------- | ----------------------- |
| `map.get(key)`                 | Yes               | No                      |
| `map.set(key, value)`          | No                | Yes                     |
| `map.has(key)`                 | Yes               | No                      |
| `map.delete(key)`              | No                | Yes                     |
| `map.size`                     | Yes               | No                      |
| `map.forEach(fn)`              | Yes (all entries) | No                      |
| `set.add(value)`               | No                | Yes                     |
| `set.has(value)`               | Yes               | No                      |
| `set.delete(value)`            | No                | Yes                     |
| `map.clear()`                  | No                | Yes                     |
| Iterating (`for...of`, spread) | Yes (all entries) | No                      |

This means computed properties and watchers that read from a reactive Map or Set will re-run when the collection is modified.

## reactive() vs ref() with collections

Both work. `reactive()` proxies the Map/Set directly, so you call methods without `.value`. `ref()` wraps it, so you access the collection through `.value`, and Vue makes the inner value reactive automatically.

```ts
// reactive(): interact with the Map directly
const map = reactive(new Map())
map.set('key', 'val') // reactive ✅

// ref(): access through .value
const map = ref(new Map())
map.value.set('key', 'val') // also reactive ✅
```

`reactive()` is more ergonomic when you only mutate entries. `ref()` is better when you might need to replace the entire collection (like swapping it for fresh data from an API):

```ts
const scores = shallowRef(new Map<string, number>())

async function refresh() {
  const data = await $fetch('/api/scores')
  const newMap = new Map(data.map((d) => [d.name, d.score]))
  scores.value = newMap // triggers update
}
```

## Computed properties over Maps

```vue
<script setup>
const permissions = reactive(
  new Map() < string,
  boolean >
    [
      ['read', true],
      ['write', false],
      ['admin', false]
    ]
)

const activePermissions = computed(() =>
  [...permissions.entries()]
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
)
</script>

<template>
  <p>Active: {{ activePermissions.join(', ') }}</p>
  <button @click="permissions.set('write', true)">Grant write</button>
</template>
```

<PlaygroundLink code="<script setup>
const permissions = reactive(
new Map() < string,
boolean >
[
['read', true],
['write', false],
['admin', false]
]
)
&#10;const activePermissions = computed(() =>
[...permissions.entries()]
.filter(([, enabled]) => enabled)
.map(([name]) => name)
)
</script>
&#10;<template>

  <p>Active: {{ activePermissions.join(', ') }}</p>
  <button @click=&quot;permissions.set('write', true)&quot;>Grant write</button>
</template>" />

The `computed` re-evaluates when any entry in the Map changes because spreading the Map calls its iterator, which Vue tracks.

## When to use Map/Set over plain objects and arrays

| Use a Map when                                               | Use a plain object when     |
| ------------------------------------------------------------ | --------------------------- |
| Keys are not strings (objects, numbers, symbols)             | Keys are string-only        |
| You need insertion-order iteration guaranteed                | Order doesn't matter        |
| You add/remove keys frequently (Maps are optimized for this) | The shape is static         |
| You need `.size` without `Object.keys().length`              | Performance isn't a concern |

| Use a Set when                                    | Use an array when                |
| ------------------------------------------------- | -------------------------------- |
| You need uniqueness enforced automatically        | Duplicates are valid             |
| You check membership often (`has()` is O(1))      | You search by index              |
| You need union/intersection/difference operations | You need `map`/`filter`/`reduce` |

## Limitations

1. **Values are deeply reactive when accessed through the Map**: `map.get('key')` returns a reactive proxy, so nested mutations like `map.get('key').nested = 'new'` are tracked. However, the original object you passed to `set()` is NOT made reactive. Only the version returned by `get()` is.

2. **WeakMap/WeakSet are limited**: they work with `reactive()` but you can't iterate them or check `.size`, which limits their usefulness in templates. They're mainly useful for internal bookkeeping in composables.

3. **Watching specific keys**: `watch` on a reactive Map watches the entire collection. To watch a specific key, use a getter:

```ts
const config = reactive(new Map<string, string>())

watch(
  () => config.get('theme'),
  (newTheme) => {
    document.documentElement.className = newTheme ?? ''
  }
)
```

See also: [Why doesn't reactive() work with primitives?](/q/reactive-with-primitives) · [What is the reactivity proxy identity hazard?](/q/proxy-identity-hazard)

## References

- [reactive() - Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [shallowRef() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#shallowref)
- [Reactivity Fundamentals - Vue guide](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
