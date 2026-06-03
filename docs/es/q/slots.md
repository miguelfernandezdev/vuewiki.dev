---
order: 25
title: '¿Qué son los slots y para qué se usan?'
difficulty: 'intermediate'
tags: ['components', 'slots']
summary: 'Los slots permiten que un padre pase contenido de template a un hijo. Slots por defecto, con nombre para múltiples áreas, scoped para datos del hijo.'
---

Los [slots](https://vuejs.org/guide/components/slots.html) permiten a un componente padre pasar contenido de template a un hijo. En lugar de que el hijo decida qué renderizar, el padre proporciona el markup y el hijo decide dónde colocarlo. Esto hace los componentes flexibles: un `Card` no necesita una prop para cada posible variación de layout; proporciona un slot y el padre lo rellena.

## Slot por defecto

La forma más simple. El hijo define un placeholder `<slot />`, y cualquier cosa que el padre ponga entre las etiquetas del componente lo reemplaza:

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <slot />
  </div>
</template>

<!-- Uso -->
<Card>
  <p>Este párrafo reemplaza el slot</p>
</Card>
```

Si el padre no proporciona nada, puedes establecer contenido por defecto: `<slot>Texto por defecto</slot>`.

## Slots con nombre

Cuando un componente tiene múltiples puntos de inserción, dale un nombre a cada slot. El padre los apunta con `<template #nombre>`:

```vue
<!-- PageLayout.vue -->
<template>
  <header><slot name="header" /></header>
  <main><slot /></main>
  <footer><slot name="footer" /></footer>
</template>

<!-- Uso -->
<PageLayout>
  <template #header>
    <h1>Dashboard</h1>
  </template>

  <p>El contenido principal va en el slot por defecto</p>

  <template #footer>
    <span>© 2025</span>
  </template>
</PageLayout>
```

`#header` es la abreviatura de `v-slot:header`. El contenido no envuelto en un `<template #nombre>` va al slot por defecto.

## Scoped slots

A veces el hijo tiene datos que el padre necesita para renderizar. Los scoped slots pasan datos del hijo de vuelta al padre a través de slot props:

```vue
<!-- ItemList.vue -->
<script setup lang="ts">
defineProps<{ items: string[] }>()
</script>

<template>
  <ul>
    <li v-for="(item, index) in items" :key="index">
      <slot name="item" :value="item" :index="index" />
    </li>
  </ul>
</template>

<!-- Uso: el padre decide cómo se ve cada item -->
<ItemList :items="['Apple', 'Banana', 'Cherry']">
  <template #item="{ value, index }">
    <strong>{{ index + 1 }}.</strong> {{ value }}
  </template>
</ItemList>
```

El hijo posee los datos y el bucle. El padre posee el renderizado. Este es el **patrón de delegación de renderizado**, la misma idea detrás de librerías headless UI como [Headless UI](https://headlessui.com/) y [Radix Vue](https://www.radix-vue.com/).

## Cuándo usar slots vs props

Usa **props** cuando el padre pasa datos y el hijo decide cómo mostrarlos. Usa **slots** cuando el padre decide qué mostrar y el hijo decide dónde colocarlo.

| Escenario                                               | Usar             |
| ------------------------------------------------------- | ---------------- |
| Pasar un string de título                               | Prop             |
| Pasar markup de header arbitrario                       | Slot con nombre  |
| El hijo tiene datos, el padre decide el renderizado     | Scoped slot      |
| Componente que envuelve contenido (card, modal, layout) | Slot por defecto |

Ver también: [¿Cómo funcionan las render functions y JSX en Vue?](/es/q/render-functions-jsx) · [¿Qué son los atributos fallthrough?](/es/q/fallthrough-attrs) · [¿Qué es defineExpose y cuándo se necesita?](/es/q/define-expose)

## Referencias

- [Slots](https://vuejs.org/guide/components/slots.html) - Vue.js docs
- [Scoped Slots](https://vuejs.org/guide/components/slots.html#scoped-slots) - Vue.js docs
- [Renderless Components](https://vuejs.org/guide/components/slots.html#renderless-components) - Vue.js docs
