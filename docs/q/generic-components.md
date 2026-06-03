---
order: 111
title: 'How do generic components work with TypeScript?'
difficulty: 'advanced'
tags: ['typescript', 'components', 'v-model', 'slots']
summary: 'The generic attribute on <script setup> (Vue 3.3+) declares type parameters that flow through props, emits, and slots for full type safety.'
---

Generic components let you write a single component that works with different data types while keeping full type safety. The `generic` attribute on `<script setup>` (Vue 3.3+) declares type parameters that flow through props, emits, and slots.

## Basic example

```vue
<!-- GenericList.vue -->
<script setup lang="ts" generic="T">
defineProps<{
  items: T[]
  selected?: T
}>()

defineEmits<{
  select: [item: T]
}>()
</script>

<template>
  <ul>
    <li
      v-for="(item, index) in items"
      :key="index"
      @click="$emit('select', item)"
    >
      <slot :item="item" />
    </li>
  </ul>
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue'

interface User {
  id: number
  name: string
}

const users = ref<User[]>([
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Luis' }
])

function onSelect(user: User) {
  // user is typed as User, not unknown
  console.log(user.name)
}
</script>

<template>
  <GenericList :items="users" @select="onSelect">
    <template #default="{ item }">
      <!-- item is typed as User -->
      {{ item.name }}
    </template>
  </GenericList>
</template>
```

TypeScript infers `T = User` from the `items` prop. The `select` event and the slot's `item` are both typed as `User` automatically.

## Multiple type parameters

```vue
<script setup lang="ts" generic="T, U extends string">
defineProps<{
  data: T[]
  labelKey: U
}>()
</script>
```

## Constraints

You can constrain generics with `extends`:

```vue
<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  items: T[]
}>()
</script>

<template>
  <div v-for="item in items" :key="item.id">
    <!-- TypeScript knows item.id exists -->
    <slot :item="item" />
  </div>
</template>
```

## Importing types in generic declarations

```vue
<script setup lang="ts" generic="T extends BaseItem">
import type { BaseItem } from '@/types'

defineProps<{
  items: T[]
}>()
</script>
```

## Before Vue 3.3

Without the `generic` attribute, you had to use `defineComponent` with a render function or JSX to get generic types, which was significantly more verbose:

```tsx
import { defineComponent } from 'vue'

function createGenericList<T>() {
  return defineComponent({
    props: { items: Array as () => T[] },
    setup(props) {
      return () => (
        <ul>
          {props.items?.map((item) => (
            <li>{String(item)}</li>
          ))}
        </ul>
      )
    }
  })
}
```

The `generic` attribute makes this pattern accessible with normal SFC templates.

## When to use generic components

| Scenario                                        | Generic?               |
| ----------------------------------------------- | ---------------------- |
| List/table/select that works with any data type | Yes                    |
| Form field wrapper with typed v-model           | Yes                    |
| Component that always works with a known type   | No, use concrete types |
| Simple UI components (buttons, cards, modals)   | No                     |

See also: [How do you declare props with TypeScript?](/q/props-with-typescript) · [How do you type slots with defineSlots?](/q/define-slots-typing) · [What are the limitations of defineProps types?](/q/defineprops-type-limitations)

## References

- [Generic Components](https://vuejs.org/api/sfc-script-setup.html#generics) - Vue.js docs
- [Typing Component Props](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props) - Vue.js docs
