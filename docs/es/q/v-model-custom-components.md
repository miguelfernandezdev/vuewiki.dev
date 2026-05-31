---
order: 12
title: "¿Cómo funciona v-model en componentes personalizados?"
difficulty: "intermediate"
tags: ["components", "directives"]
---

`v-model` en un componente es azúcar sintáctico para prop + emit:

```vue
<!-- Padre -->
<SearchInput v-model="query" />
<!-- Equivalente a: -->
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

**Múltiples v-models:**
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
