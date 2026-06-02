---
order: 24
title: "¿Cómo funciona v-model en componentes personalizados?"
difficulty: "intermediate"
tags: ["components", "directives", "v-model"]
summary: "v-model en un componente enlaza un prop modelValue y escucha update:modelValue. Usa defineModel() (Vue 3.4+) para simplificar el boilerplate."
---

Cuando escribes `v-model` en un `<input>` nativo, Vue vincula su valor y escucha eventos de input. Cuando escribes `v-model` en un componente personalizado, Vue hace algo similar: pasa una prop `modelValue` y escucha un evento `update:modelValue`. El componente controla lo que el usuario ve y cuándo emitir actualizaciones.

## A qué se expande v-model

```vue
<!-- Estos dos son equivalentes -->
<SearchInput v-model="query" />
<SearchInput :modelValue="query" @update:modelValue="query = $event" />
```

El padre proporciona los datos a través de una prop. El hijo emite un evento cuando los datos deberían cambiar. El padre decide si acepta el cambio. Esto preserva el [flujo de datos unidireccional](/es/q/flux-unidirectional-data-flow).

## defineModel (Vue 3.4+)

[`defineModel`](https://vuejs.org/api/sfc-script-setup.html#definemodel) es la forma moderna de implementar `v-model` en un componente hijo. Crea un ref que puedes leer y escribir — Vue maneja el binding de la prop y la emisión del evento internamente:

```vue
<!-- SearchInput.vue -->
<script setup lang="ts">
const model = defineModel<string>()
</script>

<template>
  <input :value="model" @input="model = ($event.target as HTMLInputElement).value" />
</template>
```

O vincúlalo directamente con `v-model` en un input nativo:

```vue
<template>
  <input v-model="model" />
</template>
```

Antes de Vue 3.4, tenías que declarar la prop y el emit por separado — `defineModel` elimina ese boilerplate.

## v-models con nombre (múltiples bindings)

Un solo componente puede tener múltiples bindings `v-model` dando un nombre a cada uno:

```vue
<!-- Padre -->
<UserForm v-model:firstName="first" v-model:lastName="last" />
```

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

Cada `v-model` con nombre se convierte en su propio par prop/emit: `:firstName` + `@update:firstName`.

## Modificadores de v-model

Vue tiene modificadores integrados (`.trim`, `.number`, `.lazy`), y puedes definir los tuyos propios. El padre pasa modificadores, y el hijo accede a ellos a través de `defineModel`:

```vue
<!-- Padre -->
<SearchInput v-model.capitalize="query" />
```

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

Ver también: [¿Cómo funcionan múltiples bindings v-model?](/es/q/multiple-v-model) · [¿Qué son los modificadores personalizados de v-model?](/es/q/custom-v-model-modifiers) · [¿Por qué mutar un objeto a través de defineModel no actualiza al padre?](/es/q/definemodel-object-mutation)

## Referencias

- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
- [v-model modifiers](https://vuejs.org/guide/components/v-model.html#handling-v-model-modifiers) - Vue.js docs
