---
order: 81
title: "What is effectScope and when would you use it?"
difficulty: "advanced"
tags: ["reactivity", "composables", "pinia", "watchers"]
summary: "effectScope collects watchers, computed, and watchEffect in a container. Calling scope.stop() disposes all of them at once."
---

[effectScope](https://vuejs.org/api/reactivity-advanced.html#effectscope) creates a container that collects all reactive effects (watchers, computed, watchEffect) created inside it. When you call `scope.stop()`, every effect in the scope is disposed at once. This is what Vue does internally for each component instance, but you can use it yourself in composables or non-component contexts.

## Basic usage

```ts
import { effectScope, ref, watch, computed } from 'vue'

const scope = effectScope()

scope.run(() => {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)

  watch(count, (val) => {
    console.log('count changed:', val)
  })
})

// Later: dispose everything created inside
scope.stop()
// The watch and computed are now cleaned up
```

## Why you need it

Inside a component, Vue automatically stops all effects when the component unmounts. But in two scenarios you don't have that safety net:

**1. Composables that create many effects.** Without `effectScope`, you'd have to track and stop each one manually:

```ts
// Without effectScope: tedious manual cleanup
function useFeature() {
  const stop1 = watch(source1, handler1)
  const stop2 = watch(source2, handler2)
  const stop3 = watchEffect(handler3)

  function cleanup() {
    stop1()
    stop2()
    stop3()
  }

  return { cleanup }
}
```

```ts
// With effectScope: one stop cleans everything
function useFeature() {
  const scope = effectScope()

  scope.run(() => {
    watch(source1, handler1)
    watch(source2, handler2)
    watchEffect(handler3)
  })

  function cleanup() {
    scope.stop()
  }

  return { cleanup }
}
```

**2. Reactive logic outside components.** Stores, service layers, or test setups that create effects but have no component lifecycle to clean them up:

```ts
// Global store with its own scope
const scope = effectScope()

const store = scope.run(() => {
  const items = ref<Item[]>([])
  const total = computed(() => items.value.length)

  watchEffect(() => {
    localStorage.setItem('items', JSON.stringify(items.value))
  })

  return { items, total }
})!

// When the store is no longer needed
scope.stop()
```

## getCurrentScope and onScopeDispose

`getCurrentScope` returns the active scope (useful for library code). `onScopeDispose` registers a cleanup callback on the current scope, similar to `onUnmounted` but for any scope, not just components:

```ts
import { getCurrentScope, onScopeDispose } from 'vue'

function useEventListener(target: EventTarget, event: string, handler: EventListener) {
  target.addEventListener(event, handler)

  if (getCurrentScope()) {
    onScopeDispose(() => {
      target.removeEventListener(event, handler)
    })
  }
}
```

This composable cleans up the listener when the scope is stopped, whether that scope belongs to a component or an `effectScope` you created yourself.

## Detached scopes

By default, a scope created inside another scope is a child and will be stopped when the parent stops. Pass `true` to create a detached scope that must be stopped independently:

```ts
const parentScope = effectScope()

parentScope.run(() => {
  const childScope = effectScope(true) // detached
  childScope.run(() => {
    // This survives parentScope.stop()
  })
})

parentScope.stop() // childScope is NOT stopped
```

## When to use effectScope

| Scenario | Use effectScope? |
|---|---|
| Normal component logic | No, Vue handles it |
| Composable with many watchers/computed | Yes, simplifies cleanup |
| Pinia-like store outside components | Yes, controls effect lifetime |
| Test setup with reactive state | Yes, clean up in afterEach |
| Single watcher you can stop manually | No, overkill |

See also: [Why do watchers created inside async callbacks cause memory leaks?](/q/watch-async-memory-leak) · [What is nextTick and when do you need it?](/q/nexttick)

## References

- [effectScope() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#effectscope)
- [watch() - Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [Composables guide - Vue docs](https://vuejs.org/guide/reusability/composables.html)
