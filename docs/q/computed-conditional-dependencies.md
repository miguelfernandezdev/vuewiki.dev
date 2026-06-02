---
order: 37
title: "Why does my computed property not update when a dependency changes?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
---

Probably because the dependency was never accessed during the first run. Vue tracks [computed](https://vuejs.org/api/reactivity-core.html#computed) dependencies by recording which reactive properties are read when the getter executes. If conditional logic prevents a property from being read, Vue never knows it's a dependency.

```ts
const isEnabled = ref(false)
const data = ref('important')

const result = computed(() => {
  if (!isEnabled.value) {
    return 'disabled' // early return, data.value never read
  }
  return data.value
})
```

When `isEnabled` is `false` on the first run, `data.value` is never accessed. Vue doesn't track it. Later, when `data` changes, the computed doesn't recalculate because Vue doesn't know `result` depends on `data`.

The same thing happens with short-circuit evaluation:

```ts
const password = ref('')
const confirm = ref('')

// If password is empty, confirm.value is never read
const isValid = computed(() => {
  return password.value && password.value === confirm.value
})
```

## How to fix it

Access all dependencies at the top of the getter, before any conditional logic:

```ts
const result = computed(() => {
  const enabled = isEnabled.value
  const currentData = data.value // always accessed

  if (!enabled) {
    return 'disabled'
  }
  return currentData
})
```

```ts
const isValid = computed(() => {
  const pwd = password.value
  const conf = confirm.value // always accessed

  return pwd && pwd === conf
})
```

This pattern works because Vue tracks every `.value` access that happens during the getter execution, regardless of whether the value is used in the return.

See also: [How does computed object stability affect re-renders?](/q/perf-computed-object-stability) · [Why does sorting an array inside computed mutate the original data?](/q/computed-sort-mutation)

## References

- [computed() — Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [Computed caching vs. methods — Vue guide](https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods)
- [Best Practices: computed — Vue guide](https://vuejs.org/guide/essentials/computed.html#best-practices)
