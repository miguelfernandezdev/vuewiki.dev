---
order: 17
title: '¿Qué es v-model y en qué se diferencia de .sync en Vue 2?'
difficulty: 'intermediate'
tags: ['directives', 'migration', 'v-model']
summary: 'v-model crea enlace bidireccional. En inputs nativos: :value + @input. En componentes: prop :modelValue + evento @update:modelValue.'
---

[`v-model`](https://vuejs.org/guide/components/v-model.html) crea un enlace bidireccional entre los datos del padre y un componente hijo (o un elemento de formulario). En elementos nativos es azúcar sintáctico para un binding `:value` más un listener `@input`. En componentes, vincula un prop y escucha un evento de actualización.

## v-model en elementos nativos

```vue
<template>
  <!-- Estas dos formas son equivalentes -->
  <input v-model="text" />
  <input
    :value="text"
    @input="text = ($event.target as HTMLInputElement).value"
  />
</template>

<script setup>
import { ref } from 'vue'
const text = ref('')
</script>
```

<PlaygroundLink code="<template>
  <!-- Estas dos formas son equivalentes -->
  <input v-model=&quot;text&quot; />
  <input
    :value=&quot;text&quot;
    @input=&quot;text = ($event.target as HTMLInputElement).value&quot;
  />
</template>
&#10;<script setup>
import { ref } from 'vue'
const text = ref('')
</script>" />

  <input
    :value=&quot;text&quot;
    @input=&quot;text = ($event.target as HTMLInputElement).value&quot;
  />
</template>
&#10;<script setup>
import { ref } from 'vue'
const text = ref('')
</script>" />

Distintos tipos de elementos usan diferentes pares prop/evento internamente:

| Elemento                  | Prop vinculado | Evento   |
| ------------------------- | -------------- | -------- |
| `<input type="text">`     | `value`        | `input`  |
| `<textarea>`              | `value`        | `input`  |
| `<input type="checkbox">` | `checked`      | `change` |
| `<input type="radio">`    | `checked`      | `change` |
| `<select>`                | `value`        | `change` |

## v-model en componentes (Vue 3)

```vue
<!-- Padre -->
<CustomInput v-model="search" />

<!-- Equivalente a: -->
<CustomInput :modelValue="search" @update:modelValue="search = $event" />
```

<PlaygroundLink code="<!-- Padre -->
<CustomInput v-model=&quot;search&quot; />
&#10;<!-- Equivalente a: -->
<CustomInput :modelValue=&quot;search&quot; @update:modelValue=&quot;search = $event&quot; />" />

&#10;<!-- Equivalente a: -->
<CustomInput :modelValue=&quot;search&quot; @update:modelValue=&quot;search = $event&quot; />" />

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

<PlaygroundLink code="<!-- CustomInput.vue (Vue 3.4+ con defineModel) -->
<script setup>
const model = defineModel<string>()
</script>
&#10;<template>
  <input v-model=&quot;model&quot; />
</template>" />

</template>" />

## Qué cambió respecto a Vue 2

En Vue 2, `v-model` usaba `value` + `input` y solo podías tener uno por componente. Para bindings bidireccionales adicionales, necesitabas el modificador `.sync` con nombres de prop distintos.

```vue
<!-- Vue 2 -->
<MyDialog v-model="isOpen" :title.sync="dialogTitle" />

<!-- Vue 2 internamente: -->
<MyDialog
  :value="isOpen"
  @input="isOpen = $event"
  :title="dialogTitle"
  @update:title="dialogTitle = $event"
/>
```

<PlaygroundLink code="<!-- Vue 2 -->
<MyDialog v-model=&quot;isOpen&quot; :title.sync=&quot;dialogTitle&quot; />
&#10;<!-- Vue 2 internamente: -->
<MyDialog
  :value=&quot;isOpen&quot;
  @input=&quot;isOpen = $event&quot;
  :title=&quot;dialogTitle&quot;
  @update:title=&quot;dialogTitle = $event&quot;
/>" />

&#10;<!-- Vue 2 internamente: -->
<MyDialog
  :value=&quot;isOpen&quot;
  @input=&quot;isOpen = $event&quot;
  :title=&quot;dialogTitle&quot;
  @update:title=&quot;dialogTitle = $event&quot;
/>" />

En Vue 3, `.sync` fue eliminado. `v-model` ahora admite argumentos con nombre, por lo que puedes tener múltiples bindings sin una API separada:

```vue
<!-- Vue 3 -->
<MyDialog v-model="isOpen" v-model:title="dialogTitle" />

<!-- Vue 3 internamente: -->
<MyDialog
  :modelValue="isOpen"
  @update:modelValue="isOpen = $event"
  :title="dialogTitle"
  @update:title="dialogTitle = $event"
/>
```

<PlaygroundLink code="<!-- Vue 3 -->
<MyDialog v-model=&quot;isOpen&quot; v-model:title=&quot;dialogTitle&quot; />
&#10;<!-- Vue 3 internamente: -->
<MyDialog
  :modelValue=&quot;isOpen&quot;
  @update:modelValue=&quot;isOpen = $event&quot;
  :title=&quot;dialogTitle&quot;
  @update:title=&quot;dialogTitle = $event&quot;
/>" />

&#10;<!-- Vue 3 internamente: -->
<MyDialog
  :modelValue=&quot;isOpen&quot;
  @update:modelValue=&quot;isOpen = $event&quot;
  :title=&quot;dialogTitle&quot;
  @update:title=&quot;dialogTitle = $event&quot;
/>" />

## Resumen de la migración

| Vue 2                                        | Vue 3                                   |
| -------------------------------------------- | --------------------------------------- |
| `v-model` vincula el prop `value`            | `v-model` vincula el prop `modelValue`  |
| Evento: `input`                              | Evento: `update:modelValue`             |
| Un `v-model` por componente                  | Múltiples `v-model` con args con nombre |
| `.sync` para bindings bidireccionales extra  | `v-model:propName` con nombre           |
| Opción `model` para personalizar prop/evento | No es necesaria, usa `v-model:name`     |

## Modificadores de v-model

Los modificadores integrados funcionan en elementos nativos:

```vue
<input v-model.lazy="msg" />
<!-- sincroniza en change, no en input -->
<input v-model.number="age" />
<!-- convierte a número -->
<input v-model.trim="name" />
<!-- elimina espacios en blanco -->
```

<PlaygroundLink code="<input v-model.lazy=&quot;msg&quot; />
<!-- sincroniza en change, no en input -->
<input v-model.number=&quot;age&quot; />
<!-- convierte a número -->
<input v-model.trim=&quot;name&quot; />
<!-- elimina espacios en blanco -->" />

<!-- sincroniza en change, no en input -->
<input v-model.number=&quot;age&quot; />
<!-- convierte a número -->
<input v-model.trim=&quot;name&quot; />
<!-- elimina espacios en blanco -->" />

Los componentes pueden definir modificadores personalizados con [`defineModel`](https://vuejs.org/api/sfc-script-setup.html#definemodel):

```vue
<script setup>
const [model, modifiers] =
  defineModel <
  string >
  {
    set(value) {
      if (modifiers.capitalize) {
        return value.charAt(0).toUpperCase() + value.slice(1)
      }
      return value
    }
  }
</script>
```

<PlaygroundLink code="<script setup>
const [model, modifiers] =
  defineModel <
  string >
  {
    set(value) {
      if (modifiers.capitalize) {
        return value.charAt(0).toUpperCase() + value.slice(1)
      }
      return value
    }
  }
</script>" />

```vue
<!-- Padre -->
<CustomInput v-model.capitalize="text" />
```

<PlaygroundLink code="<!-- Padre -->
<CustomInput v-model.capitalize=&quot;text&quot; />" />

Ver también: [Usar múltiples bindings v-model](/es/q/multiple-v-model) · [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Cómo se crean modificadores v-model personalizados?](/es/q/custom-v-model-modifiers)

## Referencias

- [v-model en componentes](https://vuejs.org/guide/components/v-model.html) - Docs de Vue.js
- [defineModel](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Docs de Vue.js
- [Bindings de formularios](https://vuejs.org/guide/essentials/forms.html) - Docs de Vue.js
