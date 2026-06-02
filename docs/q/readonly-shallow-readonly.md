---
order: 77
title: "What is readonly and shallowReadonly?"
difficulty: "intermediate"
tags: ["reactivity", "provide-inject"]
---

`readonly()` creates a deeply immutable reactive proxy. You can read all properties and they stay reactive ([computed](https://vuejs.org/api/reactivity-core.html#computed) and watchers still track changes from the original source), but any attempt to mutate them triggers a warning in development and silently fails in production. `shallowReadonly()` does the same but only for the top level: nested objects remain mutable.

## readonly

```ts
import { reactive, readonly } from 'vue'

const state = reactive({ count: 0, nested: { value: 'hello' } })
const readonlyState = readonly(state)

readonlyState.count++ // [Vue warn]: Set operation on key "count" failed: target is readonly
readonlyState.nested.value = 'world' // [Vue warn]: same warning, deeply readonly

state.count++ // works, and readonlyState.count reflects the change
```

`readonlyState` is a read-only view of `state`. It tracks the same reactive source, so when `state.count` changes, anything watching `readonlyState.count` re-renders. But you can't write through the readonly proxy.

## shallowReadonly

```ts
import { reactive, shallowReadonly } from 'vue'

const state = reactive({ count: 0, nested: { value: 'hello' } })
const shallow = shallowReadonly(state)

shallow.count++ // [Vue warn]: readonly
shallow.nested.value = 'world' // works — nested properties are NOT readonly
```

Only the root properties are protected. Nested objects are the same reactive references as the original, and mutations go through without warnings.

## The primary use case: exposing store state safely

The most common use of `readonly` is in composables or stores where you want consumers to read state but not modify it directly:

```ts
// composables/useAuth.ts
const user = ref<User | null>(null)
const isAuthenticated = computed(() => user.value !== null)

async function login(credentials: Credentials) {
  user.value = await $fetch('/api/login', {
    method: 'POST',
    body: credentials
  })
}

function logout() {
  user.value = null
}

export function useAuth() {
  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout
  }
}
```

Components can read `user` and track changes, but they can't do `user.value = fakeUser`. They must go through `login()` and `logout()`, which enforces a single place where mutations happen.

## provide/inject with readonly

When passing reactive state down a component tree, wrap it in `readonly` to prevent child components from mutating the parent's state:

```vue
<!-- Parent.vue -->
<script setup>
const config = reactive({
  theme: 'dark',
  locale: 'en'
})

provide('config', readonly(config))
provide('updateConfig', (patch: Partial<typeof config>) => {
  Object.assign(config, patch)
})
</script>
```

```vue
<!-- DeepChild.vue -->
<script setup>
const config = inject<Readonly<{ theme: string; locale: string }>>('config')
const updateConfig = inject<(patch: any) => void>('updateConfig')

// config.theme = 'light' // warns — readonly
updateConfig({ theme: 'light' }) // works — goes through the parent's function
</script>
```

This enforces unidirectional data flow through the provide/inject tree, similar to how props are read-only.

## When to use each

| Scenario | Use |
|---|---|
| Expose state from a composable | `readonly(state)` |
| Provide reactive data to descendants | `readonly(state)` via `provide` |
| Large config object where only top-level matters | `shallowReadonly(config)` |
| Third-party object with nested state you can't control | `shallowReadonly(instance)` |
| Immutable data that never changes | `Object.freeze` (not reactive at all) |

## readonly vs Object.freeze

| | `readonly` | `Object.freeze` |
|---|---|---|
| Reactive | Yes, tracks the source | No, skips reactivity entirely |
| Mutation prevention | Dev warning, silent fail in prod | TypeError in strict mode |
| Depth | Deep (all nested properties) | Shallow (must freeze recursively) |
| Can source be mutated? | Yes, through the original | No, the object itself is frozen |
| Use case | Controlled access to live state | Static data optimization |

The key difference: `readonly` creates a read-only view of data that can still change through the original reference. `Object.freeze` makes the data permanently immutable for everyone.

See also: [What happens when you use Object.freeze() on reactive data?](/q/object-freeze-reactive) · [What is the reactivity proxy identity hazard?](/q/proxy-identity-hazard)

## References

- [readonly() — Vue docs](https://vuejs.org/api/reactivity-core.html#readonly)
- [shallowReadonly() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#shallowreadonly)
- [provide / inject — Vue guide](https://vuejs.org/guide/components/provide-inject.html)
