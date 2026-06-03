---
order: 46
title: 'How do you force a component to re-render?'
difficulty: 'intermediate'
tags: ['components', 'reactivity']
summary: "Change the component's :key. Vue destroys the old instance and creates a new one from scratch. Avoid $forceUpdate, it signals broken reactivity."
---

Change the component's `key` attribute. When the key changes, Vue destroys the old instance and creates a new one from scratch, running all lifecycle hooks again and resetting all local state. This is the only clean approach. Techniques like `$forceUpdate` or incrementing a counter to trigger a re-render are almost always symptoms of a broken reactivity setup.

## The key approach

```vue
<template>
  <UserProfile :user="user" :key="user.id" />
</template>
```

<PlaygroundLink code="<template>
  <UserProfile :user=&quot;user&quot; :key=&quot;user.id&quot; />
</template>" />

When `user.id` changes, Vue unmounts the old `UserProfile` and mounts a fresh one. This is useful when a component has internal state that needs to reset when the underlying entity changes (like switching between user profiles that share the same route).

A more explicit version when you need a manual trigger:

```vue
<script setup>
const componentKey = ref(0)

function forceRecreate() {
  componentKey.value++
}
</script>

<template>
  <ExpensiveComponent :key="componentKey" />
  <button @click="forceRecreate">Reset</button>
</template>
```

<PlaygroundLink code="<script setup>
const componentKey = ref(0)
&#10;function forceRecreate() {
  componentKey.value++
}
</script>
&#10;<template>
  <ExpensiveComponent :key=&quot;componentKey&quot; />
  <button @click=&quot;forceRecreate&quot;>Reset</button>
</template>" />

## Why you rarely need this

If you feel the need to force a re-render, the reactive state is probably not set up correctly. The [ref](https://vuejs.org/api/reactivity-core.html#ref) and [reactive](https://vuejs.org/api/reactivity-core.html#reactive) primitives should handle most cases automatically. Common causes:

**Mutating an array or object without Vue tracking it:**

```ts
// BAD: Vue can't see this
items[0] = newItem

// GOOD: Vue tracks this
items.value[0] = newItem // with ref
items[0] = newItem // with reactive (Proxy catches it)
```

**Reading a non-reactive value in the template:**

```ts
// BAD: plain variable, no reactivity
let count = 0

// GOOD: reactive ref
const count = ref(0)
```

**Expecting a computed to update when its dependencies haven't changed:**

```ts
// This only re-evaluates when items.value changes
const total = computed(() => items.value.reduce((sum, i) => sum + i.price, 0))
```

Fix the reactivity, and Vue updates the DOM automatically. That's the whole point of the system.

## $forceUpdate (Options API)

In the Options API, `this.$forceUpdate()` triggers a re-render of the component without destroying it. Local state and child components are preserved:

```ts
// Options API only
export default {
  methods: {
    refresh() {
      this.$forceUpdate()
    }
  }
}
```

There is no `$forceUpdate` equivalent in the Composition API because the assumption is that if your reactive state is correct, you never need it. If you're in `<script setup>` and think you need a force update, check your reactivity setup.

## When key-based re-render is legitimate

| Scenario                                                               | Why key works                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Switching between entities on the same route (`/users/1` → `/users/2`) | Resets local state (form values, scroll position) for the new entity |
| Third-party component with internal state you can't control            | Forces fresh initialization                                          |
| After a locale/theme change that requires full reinitialization        | Some i18n libraries need components to remount                       |
| Resetting a form to its initial state                                  | Simpler than manually resetting every field                          |

## Key change vs reactive update

|                  | Key change                        | Reactive update          |
| ---------------- | --------------------------------- | ------------------------ |
| Lifecycle hooks  | All run again (`onMounted`, etc.) | None run                 |
| Local state      | Reset to initial values           | Preserved                |
| Child components | Destroyed and recreated           | Patched in place         |
| DOM              | Fully replaced                    | Minimally patched        |
| Performance      | Expensive (full teardown + setup) | Cheap (targeted updates) |

Use reactive updates by default. Reserve key-based re-rendering for cases where you genuinely need a fresh component instance.

See also: [How does Vue 3's reactivity system work?](/q/reactivity-system) · [Does reassigning a property on a reactive object break reactivity?](/q/reactive-property-reassignment)

## References

- [ref() - Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Special Attributes: key - Vue docs](https://vuejs.org/api/built-in-special-attributes.html#key)
- [Reactivity Fundamentals - Vue guide](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
