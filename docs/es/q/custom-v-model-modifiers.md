---
order: 51
title: '¿Cómo funcionan los modificadores personalizados de v-model?'
difficulty: 'advanced'
tags: ['components', 'directives', 'v-model']
summary: 'Define transformaciones set/get en defineModel para crear modificadores como .capitalize o .round que transforman valores de v-model.'
---

Vue tiene tres modificadores integrados para `v-model` en inputs nativos (`.lazy`, `.number`, `.trim`). En componentes personalizados, puedes definir los tuyos propios que transforman el valor según fluye hacia dentro o hacia fuera.

## Repaso de los modificadores integrados

```vue
<template>
  <input v-model.lazy="msg" />
  <!-- sincroniza en change, no en input -->
  <input v-model.number="age" />
  <!-- convierte a número con parseFloat -->
  <input v-model.trim="name" />
  <!-- elimina espacios en blanco -->
</template>
```

<PlaygroundLink code="<template>
  <input v-model.lazy=&quot;msg&quot; />
  <!-- sincroniza en change, no en input -->
  <input v-model.number=&quot;age&quot; />
  <!-- convierte a número con parseFloat -->
  <input v-model.trim=&quot;name&quot; />
  <!-- elimina espacios en blanco -->
</template>" />

  <!-- sincroniza en change, no en input -->
  <input v-model.number=&quot;age&quot; />
  <!-- convierte a número con parseFloat -->
  <input v-model.trim=&quot;name&quot; />
  <!-- elimina espacios en blanco -->
</template>" />

El modificador `.number` tiene un problema: devuelve una cadena vacía (no `0` ni `NaN`) cuando se borra el input, y `parseFloat("123abc")` devuelve `123`, no `NaN`.

## Modificadores personalizados con defineModel (Vue 3.4+)

`defineModel` devuelve una tupla `[ref, modifiers]` al desestructurarlo. La transformación `set` es opcional; solo la necesitas cuando quieres modificar el valor antes de almacenarlo:

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

</template>" />

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
<!-- Padre -->
<TextInput v-model.capitalize.trim="name" />
```

<PlaygroundLink code="<!-- Padre -->
<TextInput v-model.capitalize.trim=&quot;name&quot; />" />

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

## Modelos nombrados con modificadores

Los modificadores personalizados también funcionan con `v-model` nombrado:

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

</template>" />

`defineModel` elimina todo este código repetitivo.

Ver también: [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Cómo funcionan los bindings múltiples de v-model?](/es/q/multiple-v-model)

## Referencias

- [Handling v-model Modifiers](https://vuejs.org/guide/components/v-model.html#handling-v-model-modifiers) - Vue.js docs
- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
