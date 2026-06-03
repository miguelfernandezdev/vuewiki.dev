---
order: 10
title: '¿Por qué no se pueden usar v-if y v-for en el mismo elemento?'
difficulty: 'beginner'
tags: ['directives', 'errors']
summary: 'En Vue 3, v-if se ejecuta antes que v-for, así que la variable del loop no está disponible. Envuelve con <template v-for> y pon v-if dentro, o usa computed.'
---

Porque la precedencia entre ellos cambió de Vue 2 a Vue 3, y ponerlos juntos crea código ambiguo independientemente de la versión.

En **Vue 2**, `v-for` se ejecuta primero. En **Vue 3**, `v-if` se ejecuta primero. Esto significa que el mismo código se comporta de manera diferente:

```vue
<!-- Vue 2: itera todos los usuarios, luego filtra por isActive (funciona pero es ineficiente) -->
<!-- Vue 3: comprueba user.isActive ANTES del bucle, pero user aún no existe → error -->
<li v-for="user in users" v-if="user.isActive" :key="user.id">
  {{ user.name }}
</li>
```

## La forma correcta de filtrar una lista

Usa una propiedad `computed`:

```vue
<script setup lang="ts">
const activeUsers = computed(() => props.users.filter((user) => user.isActive))
</script>

<template>
  <li v-for="user in activeUsers" :key="user.id">
    {{ user.name }}
  </li>
</template>
```

Es mejor en todos los sentidos: con caché, testeable, reutilizable y sin ambigüedad.

## La forma correcta de ocultar una lista completa

Envuelve con `<template v-if>`:

```vue
<template v-if="shouldShowList">
  <li v-for="user in users" :key="user.id">
    {{ user.name }}
  </li>
</template>
```

## Condición por elemento dentro del bucle

Usa `<template v-for>` con `v-if` en un elemento hijo:

```vue
<template v-for="user in users" :key="user.id">
  <li v-if="user.isActive">
    {{ user.name }}
  </li>
</template>
```

La regla ESLint `vue/no-use-v-if-with-v-for` detecta esto automáticamente.

Ver también: [¿Qué son los modificadores de eventos?](/es/q/event-modifier-order) · [¿Por qué v-show no funciona en elementos template?](/es/q/v-show-template-limitation) · [¿Qué es v-once y v-memo?](/es/q/v-once-v-memo)

## Referencias

- [v-if with v-for](https://vuejs.org/guide/essentials/list.html#v-for-with-v-if) - Vue.js docs
- [Style Guide - Priority A](https://vuejs.org/style-guide/rules-essential.html#avoid-v-if-with-v-for) - Vue.js docs
- [List Rendering](https://vuejs.org/guide/essentials/list.html) - Vue.js docs
