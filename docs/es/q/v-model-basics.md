---
order: 70
title: "¿Qué es v-model y en qué se diferencia de .sync en Vue 2?"
difficulty: "intermediate"
tags: ["directives", "migration"]
---

[`v-model`](https://vuejs.org/guide/components/v-model.html) crea un enlace bidireccional entre los datos del padre y un componente hijo (o un elemento de formulario). En elementos nativos es azúcar sintáctico para un binding `:value` más un listener `@input`. En componentes, vincula un prop y escucha un evento de actualización.

## v-model en elementos nativos

```vue
<template>
  <!-- Estas dos formas son equivalentes -->
  <input v-model="text" />
  <input :value="text" @input="text = ($event.target as HTMLInputElement).value" />
</template>

<script setup>
import { ref } from 'vue'
const text = ref('')
</script>
```

Distintos tipos de elementos usan diferentes pares prop/evento internamente:

| Elemento | Prop vinculado | Evento |
|---|---|---|
| `<input type="text">` | `value` | `input` |
| `<textarea>` | `value` | `input` |
| `<input type="checkbox">` | `checked` | `change` |
| `<input type="radio">` | `checked` | `change` |
| `<select>` | `value` | `change` |

## v-model en componentes (Vue 3)

```vue
<!-- Padre -->
<CustomInput v-model="search" />

<!-- Equivalente a: -->
<CustomInput :modelValue="search" @update:modelValue="search = $event" />
```

El componente recibe un prop `modelValue` y emite `update:modelValue`:

```vue
<!-- CustomInput.vue (Vue 3.4+ con defineModel) -->
<script setup>
const model = defineModel<string>()
</script>

<template>
  <input v-model="model" />
</template>
```

## Qué cambió respecto a Vue 2

En Vue 2, `v-model` usaba `value` + `input` y solo podías tener uno por componente. Para bindings bidireccionales adicionales, necesitabas el modificador `.sync` con nombres de prop distintos.

```vue
<!-- Vue 2 -->
<MyDialog v-model="isOpen" :title.sync="dialogTitle" />

<!-- Vue 2 internamente: -->
<MyDialog
  :value="isOpen" @input="isOpen = $event"
  :title="dialogTitle" @update:title="dialogTitle = $event"
/>
```

En Vue 3, `.sync` fue eliminado. `v-model` ahora admite argumentos con nombre, por lo que puedes tener múltiples bindings sin una API separada:

```vue
<!-- Vue 3 -->
<MyDialog v-model="isOpen" v-model:title="dialogTitle" />

<!-- Vue 3 internamente: -->
<MyDialog
  :modelValue="isOpen" @update:modelValue="isOpen = $event"
  :title="dialogTitle" @update:title="dialogTitle = $event"
/>
```

## Resumen de la migración

| Vue 2 | Vue 3 |
|---|---|
| `v-model` vincula el prop `value` | `v-model` vincula el prop `modelValue` |
| Evento: `input` | Evento: `update:modelValue` |
| Un `v-model` por componente | Múltiples `v-model` con args con nombre |
| `.sync` para bindings bidireccionales extra | `v-model:propName` con nombre |
| Opción `model` para personalizar prop/evento | No es necesaria, usa `v-model:name` |

## Modificadores de v-model

Los modificadores integrados funcionan en elementos nativos:

```vue
<input v-model.lazy="msg" />    <!-- sincroniza en change, no en input -->
<input v-model.number="age" />  <!-- convierte a número -->
<input v-model.trim="name" />   <!-- elimina espacios en blanco -->
```

Los componentes pueden definir modificadores personalizados con [`defineModel`](https://vuejs.org/api/sfc-script-setup.html#definemodel):

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
<!-- Padre -->
<CustomInput v-model.capitalize="text" />
```

Ver también: [Usar múltiples bindings v-model](/es/q/multiple-v-model) · [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Cómo se crean modificadores v-model personalizados?](/es/q/custom-v-model-modifiers)

## Referencias

- [v-model en componentes](https://vuejs.org/guide/components/v-model.html) - Docs de Vue.js
- [defineModel](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Docs de Vue.js
- [Bindings de formularios](https://vuejs.org/guide/essentials/forms.html) - Docs de Vue.js
