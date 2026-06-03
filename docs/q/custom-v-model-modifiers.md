---
order: 51
title: 'How do custom v-model modifiers work?'
difficulty: 'advanced'
tags: ['components', 'directives', 'v-model']
summary: 'Define set/get transforms in defineModel to create modifiers like .capitalize or .round that transform v-model values as they flow in or out.'
---

Vue has three built-in modifiers for `v-model` on native inputs (`.lazy`, `.number`, `.trim`). On custom components, you can define your own modifiers that transform the value as it flows in or out.

## Built-in modifiers recap

```vue
<template>
  <input v-model.lazy="msg" />
  <!-- sync on change, not input -->
  <input v-model.number="age" />
  <!-- cast to number via parseFloat -->
  <input v-model.trim="name" />
  <!-- trim whitespace -->
</template>
```

<PlaygroundLink code="<template>
<input v-model.lazy=&quot;msg&quot; />

  <!-- sync on change, not input -->
  <input v-model.number=&quot;age&quot; />
  <!-- cast to number via parseFloat -->
  <input v-model.trim=&quot;name&quot; />
  <!-- trim whitespace -->
</template>" />

The `.number` modifier has a gotcha: it returns an empty string (not `0` or `NaN`) when the input is cleared, and `parseFloat("123abc")` returns `123`, not `NaN`.

## Custom modifiers with defineModel (Vue 3.4+)

`defineModel` returns a tuple `[ref, modifiers]` when you destructure it. The `set` transform is optional; you only need it when you want to modify the value before it's stored:

```vue
<!-- CurrencyInput.vue -->
<script setup lang="ts">
const [model, modifiers] = defineModel<number>({
  set(value) {
    if (modifiers.round) {
      return Math.round(value)
    }
    return value
  }
})
</script>

<template>
  <input type="number" v-model="model" />
</template>
```

<PlaygroundLink code="<!-- CurrencyInput.vue -->

<script setup lang=&quot;ts&quot;>
const [model, modifiers] = defineModel<number>({
  set(value) {
    if (modifiers.round) {
      return Math.round(value)
    }
    return value
  }
})
</script>

&#10;<template>
<input type=&quot;number&quot; v-model=&quot;model&quot; />
</template>" />

```vue
<!-- Parent.vue -->
<template>
  <CurrencyInput v-model.round="price" />
</template>
```

<PlaygroundLink code="<!-- Parent.vue -->
<template>
  <CurrencyInput v-model.round=&quot;price&quot; />
</template>" />

When the user types `9.7`, the parent receives `10`.

## Multiple modifiers

Modifiers are just boolean flags on an object. You can combine them:

```vue
<script setup lang="ts">
const [model, modifiers] = defineModel<string>({
  set(value) {
    let result = value
    if (modifiers.capitalize) {
      result = result.charAt(0).toUpperCase() + result.slice(1)
    }
    if (modifiers.trim) {
      result = result.trim()
    }
    return result
  }
})
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const [model, modifiers] = defineModel<string>({
  set(value) {
    let result = value
    if (modifiers.capitalize) {
      result = result.charAt(0).toUpperCase() + result.slice(1)
    }
    if (modifiers.trim) {
      result = result.trim()
    }
    return result
  }
})
</script>" />

```vue
<!-- Parent -->
<TextInput v-model.capitalize.trim="name" />
```

<PlaygroundLink code="<!-- Parent -->
<TextInput v-model.capitalize.trim=&quot;name&quot; />" />

## get transform

You can also transform the value coming from the parent:

```vue
<script setup lang="ts">
const [model, modifiers] = defineModel<string>({
  get(value) {
    if (modifiers.uppercase) {
      return value.toUpperCase()
    }
    return value
  },
  set(value) {
    return value.toLowerCase()
  }
})
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const [model, modifiers] = defineModel<string>({
  get(value) {
    if (modifiers.uppercase) {
      return value.toUpperCase()
    }
    return value
  },
  set(value) {
    return value.toLowerCase()
  }
})
</script>" />

## Named models with modifiers

Custom modifiers work with named `v-model` too:

```vue
<script setup lang="ts">
const [firstName, firstModifiers] = defineModel<string>('firstName')
const [lastName, lastModifiers] = defineModel<string>('lastName')
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const [firstName, firstModifiers] = defineModel<string>('firstName')
const [lastName, lastModifiers] = defineModel<string>('lastName')
</script>" />

```vue
<UserForm
  v-model:first-name.capitalize="first"
  v-model:last-name.capitalize="last"
/>
```

<PlaygroundLink code="<UserForm
  v-model:first-name.capitalize=&quot;first&quot;
  v-model:last-name.capitalize=&quot;last&quot;
/>" />

## Before defineModel (Vue < 3.4)

Modifiers arrive as a prop named `modelModifiers` (or `nameModifiers` for named models):

```vue
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  modelModifiers?: { capitalize?: boolean }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(e: Event) {
  let value = (e.target as HTMLInputElement).value
  if (props.modelModifiers?.capitalize) {
    value = value.charAt(0).toUpperCase() + value.slice(1)
  }
  emit('update:modelValue', value)
}
</script>

<template>
  <input :value="modelValue" @input="handleInput" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const props = defineProps<{
  modelValue: string
  modelModifiers?: { capitalize?: boolean }
}>()
&#10;const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
&#10;function handleInput(e: Event) {
  let value = (e.target as HTMLInputElement).value
  if (props.modelModifiers?.capitalize) {
    value = value.charAt(0).toUpperCase() + value.slice(1)
  }
  emit('update:modelValue', value)
}
</script>
&#10;<template>
  <input :value=&quot;modelValue&quot; @input=&quot;handleInput&quot; />
</template>" />

`defineModel` eliminates all this boilerplate.

See also: [How does v-model work on custom components?](/q/v-model-custom-components) · [How do multiple v-model bindings work?](/q/multiple-v-model)

## References

- [Handling v-model Modifiers](https://vuejs.org/guide/components/v-model.html#handling-v-model-modifiers) - Vue.js docs
- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
