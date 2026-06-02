---
order: 47
title: "Why doesn't mutating an object through defineModel update the parent?"
difficulty: "intermediate"
tags: ["components", "errors"]
---

Because `defineModel()` only emits `update:modelValue` when you reassign `model.value` itself. Mutating a property inside the object (`model.value.name = 'x'`) changes the object in place without changing the reference, so Vue never fires the update event and the parent stays out of sync.

```vue
<script setup>
const model = defineModel<{ name: string; age: number }>()

function updateName(newName: string) {
  model.value.name = newName // parent never knows
}
</script>
```

## How to fix it

**Replace the entire object** so the reference changes and the event fires.

```ts
function updateName(newName: string) {
  model.value = { ...model.value, name: newName }
}
```

For arrays, same idea:

```ts
function addItem(item: string) {
  model.value = { ...model.value, items: [...model.value.items, item] }
}
```

## Deep nesting gets verbose

```ts
// Deeply nested update
model.value = {
  ...model.value,
  user: {
    ...model.value.user,
    address: { ...model.value.user.address, city: 'Madrid' }
  }
}

// structuredClone is cleaner for complex objects
function updateCity(city: string) {
  const updated = structuredClone(model.value)
  updated.user.address.city = city
  model.value = updated
}
```

## Watch out for batching

When updating multiple fields, batch them into a single assignment. Two consecutive spreads can lose data if the second one reads a stale `model.value`.

```ts
// risky: second spread may use stale value
model.value = { ...model.value, a: '1' }
model.value = { ...model.value, b: '2' }

// safe: single assignment
model.value = { ...model.value, a: '1', b: '2' }
```

See also: [How does v-model work on custom components?](/q/v-model-custom-components) · [How do multiple v-model bindings work?](/q/multiple-v-model) · [Why does mutating props cause warnings?](/q/mutating-props-warning)

## References

- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
