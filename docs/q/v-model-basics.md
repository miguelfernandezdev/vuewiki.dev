---
order: 70
title: "What is v-model and how does it differ from .sync in Vue 2?"
difficulty: "intermediate"
tags: ["directives", "migration", "v-model"]
---

[`v-model`](https://vuejs.org/guide/components/v-model.html) creates a two-way binding between a parent's data and a child component (or a form element). On native elements it's syntactic sugar for a `:value` binding plus an `@input` listener. On components, it binds a prop and listens for an update event.

## v-model on native elements

```vue
<template>
  <!-- These two are equivalent -->
  <input v-model="text" />
  <input :value="text" @input="text = ($event.target as HTMLInputElement).value" />
</template>

<script setup>
import { ref } from 'vue'
const text = ref('')
</script>
```

Different element types use different prop/event pairs under the hood:

| Element | Bound prop | Event |
|---|---|---|
| `<input type="text">` | `value` | `input` |
| `<textarea>` | `value` | `input` |
| `<input type="checkbox">` | `checked` | `change` |
| `<input type="radio">` | `checked` | `change` |
| `<select>` | `value` | `change` |

## v-model on components (Vue 3)

```vue
<!-- Parent -->
<CustomInput v-model="search" />

<!-- Equivalent to: -->
<CustomInput :modelValue="search" @update:modelValue="search = $event" />
```

The component receives a `modelValue` prop and emits `update:modelValue`:

```vue
<!-- CustomInput.vue (Vue 3.4+ with defineModel) -->
<script setup>
const model = defineModel<string>()
</script>

<template>
  <input v-model="model" />
</template>
```

## What changed from Vue 2

In Vue 2, `v-model` used `value` + `input` and you could only have one per component. For additional two-way bindings, you needed the `.sync` modifier with different prop names.

```vue
<!-- Vue 2 -->
<MyDialog v-model="isOpen" :title.sync="dialogTitle" />

<!-- Vue 2 internally: -->
<MyDialog
  :value="isOpen" @input="isOpen = $event"
  :title="dialogTitle" @update:title="dialogTitle = $event"
/>
```

In Vue 3, `.sync` was removed. `v-model` now supports named arguments, so you get multiple bindings without a separate API:

```vue
<!-- Vue 3 -->
<MyDialog v-model="isOpen" v-model:title="dialogTitle" />

<!-- Vue 3 internally: -->
<MyDialog
  :modelValue="isOpen" @update:modelValue="isOpen = $event"
  :title="dialogTitle" @update:title="dialogTitle = $event"
/>
```

## Migration summary

| Vue 2 | Vue 3 |
|---|---|
| `v-model` binds `value` prop | `v-model` binds `modelValue` prop |
| Event: `input` | Event: `update:modelValue` |
| One `v-model` per component | Multiple `v-model` with named args |
| `.sync` for extra two-way bindings | Named `v-model:propName` |
| `model` option to customize prop/event | Not needed, use `v-model:name` |

## v-model modifiers

Built-in modifiers work on native elements:

```vue
<input v-model.lazy="msg" />    <!-- sync on change, not input -->
<input v-model.number="age" />  <!-- cast to number -->
<input v-model.trim="name" />   <!-- trim whitespace -->
```

Components can define custom modifiers with [`defineModel`](https://vuejs.org/api/sfc-script-setup.html#definemodel):

```vue
<script setup>
const [model, modifiers] = defineModel<string>({
  set(value) {
    if (modifiers.capitalize) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  }
})
</script>
```

```vue
<!-- Parent -->
<CustomInput v-model.capitalize="text" />
```

See also: [Using multiple v-model bindings](/q/multiple-v-model) · [How does v-model work on custom components?](/q/v-model-custom-components) · [How do you create custom v-model modifiers?](/q/custom-v-model-modifiers)

## References

- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
- [defineModel](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html) - Vue.js docs
