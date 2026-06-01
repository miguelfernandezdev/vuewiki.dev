---
order: 44
title: "Why do watchers created inside async callbacks cause memory leaks?"
difficulty: "advanced"
tags: ["reactivity", "errors"]
---

Because Vue only auto-cleans watchers that are created **synchronously** during `setup()`. When you create a watcher inside a `setTimeout`, `Promise.then`, or after an `await`, Vue can't bind it to the component lifecycle. It keeps running after the component unmounts.

```ts
onMounted(async () => {
  await loadInitialData()

  // This watcher is NOT bound to the component
  watch(data, (newVal) => {
    processData(newVal) // keeps running after unmount
  })
})
```

Same problem with `setTimeout`:

```ts
onMounted(() => {
  setTimeout(() => {
    watchEffect(() => {
      console.log(data.value) // keeps running after unmount
    })
  }, 1000)
})
```

## How to fix it

**Option 1 (preferred):** Create the watcher synchronously with conditional logic inside.

```ts
const config = ref(null)
const userData = ref(null)

// Created synchronously, auto-cleaned on unmount
watch(userData, (newData) => {
  if (config.value && newData) {
    applySettings(config.value, newData)
  }
})

onMounted(async () => {
  config.value = await fetchConfig()
})
```

**Option 2:** Store the stop function and call it manually on unmount.

```ts
let stopWatcher: (() => void) | null = null

onMounted(async () => {
  await loadData()

  stopWatcher = watch(data, (newVal) => {
    processData(newVal)
  })
})

onUnmounted(() => {
  stopWatcher?.()
})
```

The first option is almost always better. If you can restructure the logic so the watcher is created synchronously and the async condition is checked inside the callback, you avoid the manual cleanup entirely.
