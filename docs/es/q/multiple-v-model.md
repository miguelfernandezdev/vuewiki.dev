---
order: 37
title: "¿Cómo funcionan los bindings múltiples de v-model en un componente?"
difficulty: "intermediate"
tags: ["components", "directives", "v-model"]
summary: "Añade un nombre tras v-model: v-model:title, v-model:body. Cada uno enlaza un prop separado y emite update:title, update:body."
---

Desde Vue 3, puedes enlazar múltiples directivas `v-model` a un solo componente dándole un nombre a cada una. Esto reemplaza el patrón de Vue 2 de un `v-model` más modificadores `.sync`.

## Uso básico

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

```vue
<!-- UserForm.vue -->
<script setup>
const firstName = defineModel('firstName')
const lastName = defineModel('lastName')
</script>

<template>
  <input v-model="firstName" placeholder="Nombre" />
  <input v-model="lastName" placeholder="Apellido" />
</template>
```

`defineModel` (Vue 3.4+) crea un binding bidireccional automáticamente. Cada modelo con nombre corresponde a un `v-model:nombre` en el padre.

## Cómo funciona bajo el capó

`v-model:firstName="first"` es una abreviatura de:

```vue
<UserForm
  :firstName="first"
  @update:firstName="first = $event"
/>
```

Y `defineModel('firstName')` es una abreviatura de:

```vue
<script setup>
const props = defineProps<{ firstName: string }>()
const emit = defineEmits<{ 'update:firstName': [value: string] }>()

// Un computed con escritura que actúa como proxy de la prop
const firstName = computed({
  get: () => props.firstName,
  set: (val) => emit('update:firstName', val)
})
</script>
```

## v-model por defecto (sin nombre) junto con los nombrados

El `v-model` por defecto (sin nombre) usa `modelValue` como nombre de prop:

```vue
<!-- Parent.vue -->
<template>
  <SearchInput v-model="query" v-model:filters="activeFilters" />
</template>
```

```vue
<!-- SearchInput.vue -->
<script setup>
const query = defineModel()              // corresponde a v-model (modelValue)
const filters = defineModel('filters')   // corresponde a v-model:filters
</script>
```

## Añadir tipos

```vue
<script setup lang="ts">
const firstName = defineModel<string>('firstName', { required: true })
const age = defineModel<number>('age', { default: 0 })
</script>
```

## Antes de defineModel (Vue < 3.4)

Si estás en una versión antigua de Vue 3, declaras las props y emits manualmente:

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

`defineModel` elimina todo este boilerplate.

## Cuándo usar múltiples v-model

| Escenario | Enfoque |
|---|---|
| Un solo valor (input de búsqueda, toggle) | `v-model` (sin nombre) |
| Formulario con varios campos relacionados | Múltiples `v-model` con nombre |
| Objeto complejo como valor único | `v-model` único con un tipo de objeto |
| Valores no relacionados que cambian de forma independiente | Múltiples `v-model` con nombre |

Ver también: [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Qué son los modificadores personalizados de v-model?](/es/q/custom-v-model-modifiers) · [¿Por qué mutar un objeto a través de defineModel no actualiza el padre?](/es/q/definemodel-object-mutation)

## Referencias

- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
- [Multiple v-model bindings](https://vuejs.org/guide/components/v-model.html#multiple-v-model-bindings) - Vue.js docs
