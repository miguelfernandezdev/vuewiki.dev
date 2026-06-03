---
order: 86
title: 'How do writable computed properties work?'
difficulty: 'advanced'
tags: ['reactivity', 'pinia', 'v-model']
summary: 'A computed with a setter: reading derives the value, writing updates the underlying source. Common use: two-way computed binding for form transforms.'
---

A regular [computed](https://vuejs.org/api/reactivity-core.html#computed) property is read-only: it derives a value from reactive dependencies. A writable computed adds a setter, so you can assign to it and the setter updates the underlying source data.

## Basic example

```ts
import { ref, computed } from 'vue'

const firstName = ref('Ana')
const lastName = ref('García')

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value: string) => {
    const [first, ...rest] = value.split(' ')
    firstName.value = first
    lastName.value = rest.join(' ')
  }
})

console.log(fullName.value) // "Ana García"

fullName.value = 'Luis Fernández'
console.log(firstName.value) // "Luis"
console.log(lastName.value) // "Fernández"
```

The getter derives the value. The setter decomposes the assigned value back into the source refs.

## With v-model

Writable computed properties are useful for binding `v-model` to a derived value:

```vue
<script setup>
import { ref, computed } from 'vue'

const price = ref(100)
const taxRate = ref(0.21)

const priceWithTax = computed({
  get: () => price.value * (1 + taxRate.value),
  set: (total: number) => {
    price.value = total / (1 + taxRate.value)
  }
})
</script>

<template>
  <label>
    Price (with tax):
    <input v-model.number="priceWithTax" type="number" />
  </label>
  <p>Base price: {{ price.toFixed(2) }}</p>
</template>
```

The user edits the total, and the setter calculates the base price.

## Formatting pattern

Convert between display format and stored format:

```ts
const dateRaw = ref('2024-03-15')

const dateFormatted = computed({
  get: () => {
    const [y, m, d] = dateRaw.value.split('-')
    return `${d}/${m}/${y}`
  },
  set: (display: string) => {
    const [d, m, y] = display.split('/')
    dateRaw.value = `${y}-${m}-${d}`
  }
})

// dateFormatted.value → "15/03/2024"
// dateFormatted.value = "20/06/2024" → dateRaw becomes "2024-06-20"
```

## Proxy for store state

When you need `v-model` on a value from a Pinia store:

```ts
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const store = useSettingsStore()

const theme = computed({
  get: () => store.theme,
  set: (value: string) => store.setTheme(value)
})
```

```vue
<template>
  <select v-model="theme">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</template>
```

## Rules

- The setter must update the sources that the getter reads from. If it doesn't, the computed value will be stale.
- Don't perform async operations or side effects in getters. Setters can trigger side effects (like store actions) since they're explicitly invoked.
- If you find yourself writing complex logic in the setter, consider whether a method or watcher would be clearer.

## When to use writable computed

| Scenario                             | Writable computed?         |
| ------------------------------------ | -------------------------- |
| v-model on a derived/formatted value | Yes                        |
| Two-way binding to a store property  | Yes                        |
| Unit conversion (km/miles, C/F)      | Yes                        |
| Complex multi-step transformation    | Probably not, use a method |
| Async operations on set              | No, use a watcher          |

See also: [What is the difference between computed and watch?](/q/computed-vs-watch) · [How does Vue's v-model work with components?](/q/v-model-custom-components)

## References

- [computed() - Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [v-model - Vue guide](https://vuejs.org/guide/components/v-model.html)
- [Computed Properties - Vue guide](https://vuejs.org/guide/essentials/computed.html)
