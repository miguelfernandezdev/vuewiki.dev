---
order: 5
title: "¿Cómo se emiten eventos con TypeScript?"
difficulty: "beginner"
tags: ["typescript", "components"]
---

En Vue 3 con `<script setup>`, declaras emits usando [`defineEmits`](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) — una macro del compilador, igual que `defineProps`. El tipado con TypeScript asegura que cada llamada a `emit()` en tu componente tenga el nombre de evento correcto y los tipos de payload correctos.

## Declarando emits tipados

Pasa un tipo a `defineEmits` donde cada propiedad es un nombre de evento y el valor es una tupla de tipos de argumentos:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
  submit: []
}>()

emit('update', 'new value') // ✅
emit('update', 42)          // ❌ Error de tipo: se esperaba string
emit('submit')              // ✅
emit('submit', 'extra')     // ❌ Error de tipo: se esperaban 0 argumentos
emit('typo')                // ❌ Error de tipo: evento desconocido
</script>
```

La sintaxis de tupla con nombre (`[value: string]`) da nombres a los parámetros que aparecen en los tooltips del IDE. También puedes usar tuplas sin nombre (`[string]`), pero las nombradas son más claras.

## El lado del padre

Cuando un componente emite eventos tipados, el padre usa `@nombreEvento` (o `v-on:nombreEvento`) y obtiene inferencia de tipos completa en los parámetros del callback:

```vue
<!-- ChildComponent emite: { update: [value: string] } -->

<template>
  <ChildComponent
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>

<script setup lang="ts">
function handleUpdate(value: string) {
  // `value` está correctamente tipado como string
}

function handleDelete(id: number) {
  // `id` está correctamente tipado como number
}
</script>
```

## Emits con validación (sintaxis runtime)

Si necesitas validación en runtime — no solo verificación de tipos — usa la sintaxis de objeto:

```vue
<script setup lang="ts">
const emit = defineEmits({
  update(value: string) {
    return value.length > 0
  },
  submit() {
    return true
  }
})

emit('update', '') // emite, pero Vue muestra un warning porque la validación devolvió false
```

La función de validación se ejecuta en runtime y muestra un warning (en desarrollo) cuando devuelve `false`. Esto es independiente de la verificación en tiempo de compilación de TypeScript — puedes combinar ambos enfoques en diferentes situaciones.

## Por qué importan los emits tipados

Sin emits tipados, nada te impide emitir `'updte'` (typo) o pasar el tipo de payload incorrecto. El handler del padre recibe silenciosamente `undefined` o el tipo equivocado, y el bug aparece lejos de donde se cometió el error. Los emits tipados lo detectan en tiempo de compilación, en el componente que cometió el error.

Ver también: [¿Cómo se declaran props con TypeScript?](/es/q/props-with-typescript) · [¿Qué es el flujo de datos unidireccional?](/es/q/flux-unidirectional-data-flow) · [¿Qué son los atributos fallthrough?](/es/q/fallthrough-attrs)

## Referencias

- [Typing Component Emits](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits) - Vue.js docs
- [defineEmits()](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
- [Component Events](https://vuejs.org/guide/components/events.html) - Vue.js docs
