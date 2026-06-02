---
order: 78
title: "¿Cómo funcionan los modificadores personalizados de v-model?"
difficulty: "advanced"
tags: ["components", "directives", "v-model"]
---

Vue tiene tres modificadores integrados para `v-model` en inputs nativos (`.lazy`, `.number`, `.trim`). En componentes personalizados, puedes definir los tuyos propios que transforman el valor según fluye hacia dentro o hacia fuera.

## Repaso de los modificadores integrados

```vue
<template>
  <input v-model.lazy="msg" />    <!-- sincroniza en change, no en input -->
  <input v-model.number="age" />  <!-- convierte a número con parseFloat -->
  <input v-model.trim="name" />   <!-- elimina espacios en blanco -->
</template>
```

El modificador `.number` tiene un problema: devuelve una cadena vacía (no `0` ni `NaN`) cuando se borra el input, y `parseFloat("123abc")` devuelve `123`, no `NaN`.

## Modificadores personalizados con defineModel (Vue 3.4+)

`defineModel` devuelve una tupla `[ref, modifiers]` cuando proporcionas una transformación `set`:

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

```vue
<!-- Parent.vue -->
<template>
  <CurrencyInput v-model.round="price" />
</template>
```

Cuando el usuario escribe `9.7`, el padre recibe `10`.

## Varios modificadores

Los modificadores son simplemente flags booleanos en un objeto. Puedes combinarlos:

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

```vue
<!-- Padre -->
<TextInput v-model.capitalize.trim="name" />
```

## Transformación get

También puedes transformar el valor que viene del padre:

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

## Modelos nombrados con modificadores

Los modificadores personalizados también funcionan con `v-model` nombrado:

```vue
<script setup lang="ts">
const [firstName, firstModifiers] = defineModel<string>('firstName')
const [lastName, lastModifiers] = defineModel<string>('lastName')
</script>
```

```vue
<UserForm v-model:first-name.capitalize="first" v-model:last-name.capitalize="last" />
```

## Antes de defineModel (Vue < 3.4)

Los modificadores llegan como una prop llamada `modelModifiers` (o `nameModifiers` para modelos nombrados):

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

`defineModel` elimina todo este código repetitivo.

Ver también: [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Cómo funcionan los bindings múltiples de v-model?](/es/q/multiple-v-model)

## Referencias

- [Handling v-model Modifiers](https://vuejs.org/guide/components/v-model.html#handling-v-model-modifiers) - Vue.js docs
- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
