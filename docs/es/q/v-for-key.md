---
order: 7
title: "¿Para qué sirve :key en v-for?"
difficulty: "beginner"
tags: ["directives"]
---

Cuando Vue renderiza una lista con [`v-for`](https://vuejs.org/guide/essentials/list.html), necesita saber qué elemento del DOM corresponde a qué elemento del array. El atributo `:key` es ese identificador. Sin él (o con una key incorrecta), Vue toma atajos que pueden provocar bugs reales.

## Qué falla sin una key adecuada

Sin una key única, Vue reutiliza los elementos del DOM por posición. Si eliminas el segundo elemento de una lista, Vue no elimina el segundo `<li>` — actualiza el texto de los elementos 2, 3, 4... y elimina el último. Esto es eficiente para texto simple, pero falla cuando los elementos tienen su propio estado.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' }
])

function removeFirst() {
  items.value.shift()
}
</script>

<template>
  <!-- ❌ key=index: tras eliminar Apple, el input que tenía el texto de Apple
       ahora aparece junto a Banana — el estado no coincide -->
  <div v-for="(item, index) in items" :key="index">
    <span>{{ item.name }}</span>
    <input placeholder="Escribe algo" />
  </div>

  <!-- ✅ key=item.id: Vue elimina correctamente el nodo DOM de Apple,
       Banana y Cherry conservan sus inputs y su estado -->
  <div v-for="item in items" :key="item.id">
    <span>{{ item.name }}</span>
    <input placeholder="Escribe algo" />
  </div>
</template>
```

Escribe algo en cada input y luego elimina el primer elemento. Con `key=index`, los inputs se mezclan. Con `key=item.id`, el nodo DOM correcto se elimina y todo lo demás permanece en su sitio.

## Las reglas

1. **Usa siempre `:key`** en los elementos con `v-for`.
2. **Usa un identificador único y estable** — un `id` de tus datos, una clave primaria de base de datos, un slug. Algo que no cambie entre renderizados.
3. **Nunca uses el índice del array como key** si los elementos pueden reordenarse, insertarse o eliminarse. El índice cambia cuando el array cambia, lo que invalida el propósito.
4. **Las keys deben ser primitivos** — strings o números. Los objetos no funcionan.

```vue
<!-- ✅ Bien: ID estable de los datos -->
<li v-for="user in users" :key="user.id">{{ user.name }}</li>

<!-- ✅ Bien: string único y estable -->
<li v-for="tab in tabs" :key="tab.slug">{{ tab.label }}</li>

<!-- ❌ Mal: el índice cambia cuando el array cambia -->
<li v-for="(item, i) in items" :key="i">{{ item.name }}</li>
```

## Cuándo el índice es válido

Si la lista es **estática** (nunca se reordena, no hay añadidos ni eliminaciones) y los elementos no tienen estado interno (sin inputs, sin componentes hijo), entonces `key=index` no causará bugs. Pero usar un ID real es un hábito seguro que no cuesta nada.

Ver también: [¿Cómo funciona el renderizado de listas con v-for?](/es/q/list-rendering-v-for) · [¿Cuál es la diferencia entre v-if y v-show?](/es/q/v-if-vs-v-show)

## Referencias

- [Mantener el estado con key](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key) - Docs de Vue.js
- [v-for](https://vuejs.org/api/built-in-directives.html#v-for) - Docs de Vue.js
- [Renderizado de Listas](https://vuejs.org/guide/essentials/list.html) - Docs de Vue.js
