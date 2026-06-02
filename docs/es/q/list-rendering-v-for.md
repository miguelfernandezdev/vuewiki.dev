---
order: 13
title: "¿Cómo funciona el renderizado de listas con v-for?"
difficulty: "beginner"
tags: ["directives"]
summary: "v-for itera sobre arrays, objetos, números y strings. Siempre proporciona un :key único para que Vue rastree y reutilice elementos DOM eficientemente."
---

[`v-for`](https://vuejs.org/guide/essentials/list.html) itera sobre arrays, objetos, números y strings para renderizar una lista de elementos. Funciona como un bucle `for...of` en JavaScript, pero dentro del template.

## Arrays

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' }
])
</script>
```

El segundo argumento te da el índice:

```vue
<li v-for="(item, index) in items" :key="item.id">
  {{ index }}. {{ item.name }}
</li>
```

## Objetos

```vue
<template>
  <div v-for="(value, key, index) in user" :key="key">
    {{ index }}. {{ key }}: {{ value }}
  </div>
</template>

<script setup>
const user = { name: 'Ana', role: 'Dev', level: 'Senior' }
</script>
```

## Rangos

```vue
<!-- Renderiza del 1 al 5 -->
<span v-for="n in 5" :key="n">{{ n }}</span>
```

## Por qué importa `:key`

Sin `:key`, Vue reutiliza los elementos del DOM por posición. Esto falla cuando los elementos se reordenan, se eliminan o se insertan en medio, porque el state del componente y el state del DOM se dessincronizan.

```vue
<!-- Incorrecto: el índice como key tiene el mismo problema que ninguna key al reordenar -->
<li v-for="(item, index) in items" :key="index">...</li>

<!-- Correcto: identificador único y estable -->
<li v-for="item in items" :key="item.id">...</li>
```

## v-for en template

Cuando necesitas renderizar varios elementos por iteración sin un wrapper:

```vue
<template>
  <ul>
    <template v-for="item in items" :key="item.id">
      <li>{{ item.name }}</li>
      <li class="divider" role="presentation"></li>
    </template>
  </ul>
</template>
```

## v-for con componentes

```vue
<template>
  <UserCard
    v-for="user in users"
    :key="user.id"
    :user="user"
    @remove="removeUser(user.id)"
  />
</template>
```

Las props no se inyectan automáticamente desde la iteración. Tienes que enlazarlas explícitamente.

## Mutar vs reemplazar arrays

Vue detecta las llamadas a métodos de mutación (`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`) en arrays reactivos y actualiza el DOM. Para los métodos no mutadores (`filter`, `map`, `concat`), asigna el resultado de vuelta al ref:

```ts
// Mutación: Vue lo detecta
items.value.push({ id: 4, name: 'Date' })

// Reemplazo: asigna el nuevo array
items.value = items.value.filter(i => i.name !== 'Banana')
```

Ver también: [¿Para qué sirve :key en v-for?](/es/q/v-for-key)

## Referencias

- [Renderizado de Listas](https://vuejs.org/guide/essentials/list.html) - Docs de Vue.js
- [v-for](https://vuejs.org/api/built-in-directives.html#v-for) - Docs de Vue.js
