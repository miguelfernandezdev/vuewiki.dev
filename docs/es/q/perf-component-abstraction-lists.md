---
order: 125
title: '¿Por qué deberías evitar la abstracción en componentes dentro de listas grandes?'
difficulty: 'advanced'
tags: ['performance', 'components']
summary: 'Cada instancia de componente tiene overhead (setup reactivo, vnode, lifecycle). En listas grandes, aplana el árbol de componentes para reducir instancias.'
---

Cada instancia de componente Vue tiene un coste: configuración reactiva, creación de vnode, lifecycle hooks y memoria para el proxy de la instancia. Para un solo componente es despreciable. En una lista de 100 o más elementos, el coste se multiplica. Si cada elemento de la lista tiene 5 componentes anidados, son 500 instancias en lugar de 100.

## El problema

```vue
<!-- UserCard.vue — profundamente anidado -->
<template>
  <Card>
    <CardHeader>
      <UserAvatar :src="user.avatar" />
    </CardHeader>
    <CardBody>
      <Text>{{ user.name }}</Text>
    </CardBody>
  </Card>
</template>
```

<PlaygroundLink code="<!-- UserCard.vue — profundamente anidado -->
<template>
  <Card>
    <CardHeader>
      <UserAvatar :src=&quot;user.avatar&quot; />
    </CardHeader>
    <CardBody>
      <Text>{{ user.name }}</Text>
    </CardBody>
  </Card>
</template>" />

    </CardHeader>
    <CardBody>
      <Text>{{ user.name }}</Text>
    </CardBody>
  </Card>
</template>" />

```vue
<!-- 100 usuarios = 500+ instancias de componentes -->
<UserCard v-for="user in users" :key="user.id" :user="user" />
```

<PlaygroundLink code="<!-- 100 usuarios = 500+ instancias de componentes -->
<UserCard v-for=&quot;user in users&quot; :key=&quot;user.id&quot; :user=&quot;user&quot; />" />

Cada `Card`, `CardHeader`, `CardBody`, `UserAvatar` y `Text` es una instancia de componente independiente. Multiplica por 100 elementos de lista y obtienes una sobrecarga significativa de memoria y renderizado.

## La solución: aplanar los elementos de lista

Reemplaza los componentes wrapper por elementos HTML simples en los elementos de lista que están en el camino crítico:

```vue
<!-- UserCard.vue — aplanado -->
<script setup lang="ts">
defineProps<{ user: { id: string; name: string; avatar: string } }>()
</script>

<template>
  <div class="card">
    <div class="card-header">
      <img :src="user.avatar" :alt="user.name" class="avatar" />
    </div>
    <div class="card-body">
      <span>{{ user.name }}</span>
    </div>
  </div>
</template>
```

<PlaygroundLink code="<!-- UserCard.vue — aplanado -->
<script setup lang=&quot;ts&quot;>
defineProps<{ user: { id: string; name: string; avatar: string } }>()
</script>
&#10;<template>
  <div class=&quot;card&quot;>
    <div class=&quot;card-header&quot;>
      <img :src=&quot;user.avatar&quot; :alt=&quot;user.name&quot; class=&quot;avatar&quot; />
    </div>
    <div class=&quot;card-body&quot;>
      <span>{{ user.name }}</span>
    </div>
  </div>
</template>" />

    </div>
    <div class=&quot;card-body&quot;>
      <span>{{ user.name }}</span>
    </div>
  </div>
</template>" />

100 usuarios ahora crean 100 instancias de componente en lugar de 500. El resultado visual es idéntico.

## El impacto en números

| Tamaño de lista | Componentes por elemento | Total de instancias |
| --------------- | ------------------------ | ------------------- |
| 100             | 1 (plano)                | 100                 |
| 100             | 5 (anidado)              | 500                 |
| 1.000           | 1 (plano)                | 1.000               |
| 1.000           | 5 (anidado)              | 5.000               |

Cada instancia añade aproximadamente 1-2 KB de sobrecarga de memoria. Con 5.000 instancias, eso son 5-10 MB solo para el scaffolding de componentes.

## Cuándo la abstracción está bien

No todas las listas necesitan aplanarse. Mantén las abstracciones de componentes cuando:

**La lista es pequeña** (menos de 20-30 elementos). La sobrecarga no es perceptible.

**La lista está virtualizada.** Si usas `vue-virtual-scroller` o `@tanstack/vue-virtual`, solo se renderizan 10-20 elementos en cualquier momento. El anidamiento profundo en cada elemento es aceptable porque el total de instancias se mantiene bajo.

```vue
<RecycleScroller :items="items" :item-size="80">
  <template #default="{ item }">
    <!-- Bien: solo existen ~20 instancias independientemente del tamaño de la lista -->
    <ComplexItemCard :item="item" />
  </template>
</RecycleScroller>
```

<PlaygroundLink code="<RecycleScroller :items=&quot;items&quot; :item-size=&quot;80&quot;>
  <template #default=&quot;{ item }&quot;>
    <!-- Bien: solo existen ~20 instancias independientemente del tamaño de la lista -->
    <ComplexItemCard :item=&quot;item&quot; />
  </template>
</RecycleScroller>" />

  </template>
</RecycleScroller>" />

**El componente tiene lógica real** (tooltips, estado, manejo de eventos), no solo estilos. Extraer un `UserStatusBadge` con lógica de renderizado condicional y un tooltip merece la sobrecarga.

## Qué aplanar

Reemplaza con elementos simples:

| En lugar de                                | Usa                        |
| ------------------------------------------ | -------------------------- |
| Wrapper `<Card>`                           | `<div class="card">`       |
| `<Text>` para tipografía                   | `<span class="text-body">` |
| Componentes de layout `<Flex>` / `<Stack>` | `<div class="flex gap-2">` |
| `<Avatar>` que solo envuelve un img        | `<img class="avatar">`     |

Mantén como componentes:

| Componente          | Por qué                                         |
| ------------------- | ----------------------------------------------- |
| `<UserStatusBadge>` | Tiene lógica condicional, tooltip               |
| `<EditableField>`   | Gestiona su propio estado de edición            |
| `<LazyImage>`       | Gestiona intersection observer, estado de carga |

## Cómo medir

Abre Vue DevTools y mira la pestaña Componentes. Cuenta cuántas instancias existen cuando se renderiza tu lista. Si ves miles, comprueba si aplanar los elementos de lista reduce esa cifra de forma significativa.

La pestaña Performance de DevTools también muestra el tiempo de renderizado por componente. Ordena por tiempo total para encontrar los componentes más costosos en tu lista.

Ver también: [¿Qué es la estabilidad de props y por qué importa para el rendimiento?](/es/q/perf-props-stability) · [¿Qué es el Virtual DOM y cómo lo usa Vue?](/es/q/virtual-dom) · [¿Cuál es la diferencia entre un VNode de componente y un VNode de elemento?](/es/q/component-vs-element-vnode)

## Referencias

- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) - Virtual scrolling library
