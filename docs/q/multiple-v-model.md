---
order: 37
title: 'How do multiple v-model bindings work on a component?'
difficulty: 'intermediate'
tags: ['components', 'directives', 'v-model']
summary: 'Add a name after v-model: v-model:title, v-model:body. Each binds a separate prop and emits update:title, update:body.'
---

Since Vue 3, you can bind multiple `v-model` directives to a single component by giving each one a name. This replaces the Vue 2 pattern of one `v-model` plus `.sync` modifiers.

## Basic usage

```vue
<!-- Parent.vue -->
<template>
  <UserForm v-model:first-name="first" v-model:last-name="last" />
</template>

<script setup>
import { ref } from 'vue'

const first = ref('Ana')
const last = ref('García')
</script>
```

<PlaygroundLink code="<!-- Parent.vue -->
<template>
  <UserForm v-model:first-name=&quot;first&quot; v-model:last-name=&quot;last&quot; />
</template>
&#10;<script setup>
import { ref } from 'vue'
&#10;const first = ref('Ana')
const last = ref('García')
</script>" />

```vue
<!-- UserForm.vue -->
<script setup>
const firstName = defineModel('firstName')
const lastName = defineModel('lastName')
</script>

<template>
  <input v-model="firstName" placeholder="First name" />
  <input v-model="lastName" placeholder="Last name" />
</template>
```

<PlaygroundLink code="<!-- UserForm.vue -->

<script setup>
const firstName = defineModel('firstName')
const lastName = defineModel('lastName')
</script>

&#10;<template>
<input v-model=&quot;firstName&quot; placeholder=&quot;First name&quot; />
<input v-model=&quot;lastName&quot; placeholder=&quot;Last name&quot; />
</template>" />

`defineModel` (Vue 3.4+) creates a two-way binding automatically. Each named model corresponds to a `v-model:name` on the parent.

## How it works under the hood

`v-model:firstName="first"` is shorthand for:

```vue
<UserForm :firstName="first" @update:firstName="first = $event" />
```

<PlaygroundLink code="<UserForm :firstName=&quot;first&quot; @update:firstName=&quot;first = $event&quot; />" />

And `defineModel('firstName')` is shorthand for:

```vue
<script setup>
const props = defineProps<{ firstName: string }>()
const emit = defineEmits<{ 'update:firstName': [value: string] }>()

// A writable computed that proxies the prop
const firstName = computed({
  get: () => props.firstName,
  set: (val) => emit('update:firstName', val)
})
</script>
```

<PlaygroundLink code="<script setup>
const props = defineProps<{ firstName: string }>()
const emit = defineEmits<{ 'update:firstName': [value: string] }>()
&#10;// A writable computed that proxies the prop
const firstName = computed({
  get: () => props.firstName,
  set: (val) => emit('update:firstName', val)
})
</script>" />

## Default (unnamed) v-model alongside named ones

The default `v-model` (without a name) uses `modelValue` as the prop name:

```vue
<!-- Parent.vue -->
<template>
  <SearchInput v-model="query" v-model:filters="activeFilters" />
</template>
```

<PlaygroundLink code="<!-- Parent.vue -->
<template>
  <SearchInput v-model=&quot;query&quot; v-model:filters=&quot;activeFilters&quot; />
</template>" />

```vue
<!-- SearchInput.vue -->
<script setup>
const query = defineModel() // maps to v-model (modelValue)
const filters = defineModel('filters') // maps to v-model:filters
</script>
```

<PlaygroundLink code="<!-- SearchInput.vue -->

<script setup>
const query = defineModel() // maps to v-model (modelValue)
const filters = defineModel('filters') // maps to v-model:filters
</script>" />

## Adding types

```vue
<script setup lang="ts">
const firstName = defineModel<string>('firstName', { required: true })
const age = defineModel<number>('age', { default: 0 })
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const firstName = defineModel<string>('firstName', { required: true })
const age = defineModel<number>('age', { default: 0 })
</script>" />

## Before defineModel (Vue < 3.4)

If you're on an older Vue 3 version, you declare the props and emits manually:

```vue
<script setup>
const props = defineProps<{
  firstName: string
  lastName: string
}>()

const emit = defineEmits<{
  'update:firstName': [value: string]
  'update:lastName': [value: string]
}>()
</script>

<template>
  <input
    :value="firstName"
    @input="emit('update:firstName', ($event.target as HTMLInputElement).value)"
  />
  <input
    :value="lastName"
    @input="emit('update:lastName', ($event.target as HTMLInputElement).value)"
  />
</template>
```

<PlaygroundLink code="<script setup>
const props = defineProps<{
  firstName: string
  lastName: string
}>()
&#10;const emit = defineEmits<{
  'update:firstName': [value: string]
  'update:lastName': [value: string]
}>()
</script>
&#10;<template>
  <input
    :value=&quot;firstName&quot;
    @input=&quot;emit('update:firstName', ($event.target as HTMLInputElement).value)&quot;
  />
  <input
    :value=&quot;lastName&quot;
    @input=&quot;emit('update:lastName', ($event.target as HTMLInputElement).value)&quot;
  />
</template>" />

`defineModel` removes all this boilerplate.

## When to use multiple v-model

| Scenario                                   | Approach                             |
| ------------------------------------------ | ------------------------------------ |
| Single value (search input, toggle)        | `v-model` (unnamed)                  |
| Form with several related fields           | Multiple named `v-model`             |
| Complex object as a single value           | Single `v-model` with an object type |
| Unrelated values that change independently | Multiple named `v-model`             |

See also: [How does v-model work on custom components?](/q/v-model-custom-components) · [What are custom v-model modifiers?](/q/custom-v-model-modifiers) · [Why doesn't mutating an object through defineModel update the parent?](/q/definemodel-object-mutation)

## References

- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
- [Multiple v-model bindings](https://vuejs.org/guide/components/v-model.html#multiple-v-model-bindings) - Vue.js docs
