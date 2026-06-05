---
order: 24
title: 'How does v-model work on custom components?'
difficulty: 'intermediate'
tags: ['components', 'directives', 'v-model']
summary: 'v-model on a component binds a modelValue prop and listens for update:modelValue. Use defineModel() (Vue 3.4+) to simplify the boilerplate.'
---

When you write `v-model` on a native `<input>`, Vue binds its value and listens for input events. When you write `v-model` on a custom component, Vue does something similar: it passes a `modelValue` prop and listens for an `update:modelValue` event. The component controls what the user sees and when to emit updates.

<img src="/diagrams/en/v-model-custom-components.svg" alt="Data flow diagram for v-model with custom components using defineModel" style="max-width: 100%;" />

## What v-model expands to

```vue
<!-- These two are equivalent -->
<SearchInput v-model="query" />
<SearchInput :modelValue="query" @update:modelValue="query = $event" />
```

<PlaygroundLink code="<SearchInput v-model=&quot;query&quot; />
<SearchInput :modelValue=&quot;query&quot; @update:modelValue=&quot;query = $event&quot; />" />

The parent provides the data through a prop. The child emits an event when the data should change. The parent decides whether to accept the change. This preserves [one-way data flow](/q/flux-unidirectional-data-flow).

## defineModel (Vue 3.4+)

[`defineModel`](https://vuejs.org/api/sfc-script-setup.html#definemodel) is the modern way to implement `v-model` in a child component. It creates a ref that you can read and write. Vue handles the prop binding and event emission behind the scenes:

```vue
<!-- SearchInput.vue -->
<script setup lang="ts">
const model = defineModel<string>()
</script>

<template>
  <input
    :value="model"
    @input="model = ($event.target as HTMLInputElement).value"
  />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const model = defineModel<string>()
</script>
&#10;<template>
  <input
    :value=&quot;model&quot;
    @input=&quot;model = ($event.target as HTMLInputElement).value&quot;
  />
</template>" />

Or bind it directly with `v-model` on a native input:

```vue
<template>
  <input v-model="model" />
</template>
```

<PlaygroundLink code="<template>
  <input v-model=&quot;model&quot; />
</template>" />

Before Vue 3.4, you had to declare the prop and emit separately. `defineModel` removes that boilerplate.

## Named v-models (multiple bindings)

A single component can have multiple `v-model` bindings by giving each a name:

```vue
<!-- Parent -->
<UserForm v-model:firstName="first" v-model:lastName="last" />
```

<PlaygroundLink code="<UserForm v-model:firstName=&quot;first&quot; v-model:lastName=&quot;last&quot; />" />

```vue
<!-- UserForm.vue -->
<script setup lang="ts">
const firstName = defineModel<string>('firstName')
const lastName = defineModel<string>('lastName')
</script>

<template>
  <input v-model="firstName" placeholder="First name" />
  <input v-model="lastName" placeholder="Last name" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const firstName = defineModel<string>('firstName')
const lastName = defineModel<string>('lastName')
</script>
&#10;<template>
  <input v-model=&quot;firstName&quot; placeholder=&quot;First name&quot; />
  <input v-model=&quot;lastName&quot; placeholder=&quot;Last name&quot; />
</template>" />

Each named `v-model` becomes its own prop/emit pair: `:firstName` + `@update:firstName`.

## v-model modifiers

Vue has built-in modifiers (`.trim`, `.number`, `.lazy`), and you can define custom ones. The parent passes modifiers, and the child accesses them through `defineModel`:

```vue
<!-- Parent -->
<SearchInput v-model.capitalize="query" />
```

<PlaygroundLink code="<SearchInput v-model.capitalize=&quot;query&quot; />" />

```vue
<!-- SearchInput.vue -->
<script setup lang="ts">
const [model, modifiers] = defineModel<string>({
  set(value) {
    if (modifiers.capitalize) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  }
})
</script>

<template>
  <input v-model="model" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const [model, modifiers] = defineModel<string>({
  set(value) {
    if (modifiers.capitalize) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  }
})
</script>
&#10;<template>
  <input v-model=&quot;model&quot; />
</template>" />

See also: [How do multiple v-model bindings work?](/q/multiple-v-model) · [What are custom v-model modifiers?](/q/custom-v-model-modifiers) · [Why doesn't mutating an object through defineModel update the parent?](/q/definemodel-object-mutation)

## References

- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
- [v-model modifiers](https://vuejs.org/guide/components/v-model.html#handling-v-model-modifiers) - Vue.js docs
