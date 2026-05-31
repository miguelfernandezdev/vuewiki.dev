---
order: 12
title: "How does v-model work on custom components?"
difficulty: "intermediate"
tags: ["components", "directives"]
---

`v-model` on a component is syntactic sugar for prop + emit:

```vue
<!-- Parent -->
<SearchInput v-model="query" />
<!-- Equivalent to: -->
<SearchInput :modelValue="query" @update:modelValue="query = $event" />
```

```vue
<!-- SearchInput.vue (Vue 3.4+) -->
<script setup lang="ts">
const model = defineModel<string>()
</script>

<template>
  <input v-model="model" />
</template>
```

**Multiple v-models:**
```vue
<UserForm v-model:name="userName" v-model:email="userEmail" />
```

```vue
<!-- UserForm.vue -->
<script setup lang="ts">
const name = defineModel<string>('name')
const email = defineModel<string>('email')
</script>
```
