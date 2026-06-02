---
order: 73
title: "¿Cómo funcionan los componentes genéricos con TypeScript?"
difficulty: "advanced"
tags: ["typescript", "components"]
---

Los componentes genéricos permiten escribir un único componente que funciona con diferentes tipos de datos manteniendo la seguridad de tipos completa. El atributo `generic` en `<script setup>` (Vue 3.3+) declara parámetros de tipo que fluyen a través de las props, los emits y los slots.

## Ejemplo básico

```vue
<!-- GenericList.vue -->
<script setup lang="ts" generic="T">
defineProps<{
  items: T[]
  selected?: T
}>()

defineEmits<{
  select: [item: T]
}>()
</script>

<template>
  <ul>
    <li
      v-for="(item, index) in items"
      :key="index"
      @click="$emit('select', item)"
    >
      <slot :item="item" />
    </li>
  </ul>
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue'

interface User {
  id: number
  name: string
}

const users = ref<User[]>([
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Luis' }
])

function onSelect(user: User) {
  // user tiene tipo User, no unknown
  console.log(user.name)
}
</script>

<template>
  <GenericList :items="users" @select="onSelect">
    <template #default="{ item }">
      <!-- item tiene tipo User -->
      {{ item.name }}
    </template>
  </GenericList>
</template>
```

TypeScript infiere `T = User` a partir de la prop `items`. El evento `select` y el `item` del slot tienen ambos tipo `User` automáticamente.

## Múltiples parámetros de tipo

```vue
<script setup lang="ts" generic="T, U extends string">
defineProps<{
  data: T[]
  labelKey: U
}>()
</script>
```

## Restricciones

Puedes restringir los genéricos con `extends`:

```vue
<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  items: T[]
}>()
</script>

<template>
  <div v-for="item in items" :key="item.id">
    <!-- TypeScript sabe que item.id existe -->
    <slot :item="item" />
  </div>
</template>
```

## Importar tipos en declaraciones genéricas

```vue
<script setup lang="ts" generic="T extends BaseItem">
import type { BaseItem } from '@/types'

defineProps<{
  items: T[]
}>()
</script>
```

## Antes de Vue 3.3

Sin el atributo `generic`, había que usar `defineComponent` con una render function o JSX para obtener tipos genéricos, lo que era considerablemente más verboso:

```tsx
import { defineComponent } from 'vue'

function createGenericList<T>() {
  return defineComponent({
    props: { items: Array as () => T[] },
    setup(props) {
      return () => (
        <ul>
          {props.items?.map(item => <li>{String(item)}</li>)}
        </ul>
      )
    }
  })
}
```

El atributo `generic` hace que este patrón sea accesible con templates SFC normales.

## Cuándo usar componentes genéricos

| Escenario | ¿Genérico? |
|---|---|
| Lista/tabla/select que funciona con cualquier tipo de datos | Sí |
| Wrapper de campo de formulario con v-model tipado | Sí |
| Componente que siempre trabaja con un tipo concreto conocido | No, usa tipos concretos |
| Componentes UI simples (botones, tarjetas, modales) | No |

Ver también: [¿Cómo declarar props con TypeScript?](/es/q/props-with-typescript) · [¿Cómo tipar slots con defineSlots?](/es/q/define-slots-typing) · [¿Cuáles son las limitaciones de los tipos en defineProps?](/es/q/defineprops-type-limitations)

## Referencias

- [Generic Components](https://vuejs.org/api/sfc-script-setup.html#generics) - Vue.js docs
- [Typing Component Props](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props) - Vue.js docs
