---
order: 22
title: "¿Cuál es la diferencia entre props y estado en Vue?"
difficulty: "beginner"
tags: ["components", "reactivity", "v-model"]
summary: "Props son datos de solo lectura pasados desde el padre. State (ref/reactive) son datos que el componente posee y puede modificar."
---

Las props son datos que se pasan **hacia abajo** desde un componente padre. El estado (datos reactivos locales) es datos que el componente **posee** y gestiona él mismo. La diferencia clave: las props son de solo lectura, el estado es de lectura y escritura. El estado se declara con [ref](https://vuejs.org/api/reactivity-core.html#ref) o [reactive](https://vuejs.org/api/reactivity-core.html#reactive).

```vue
<!-- Parent.vue -->
<template>
  <UserCard :name="userName" :role="userRole" />
</template>

<script setup>
import { ref } from 'vue'
const userName = ref('Ana')
const userRole = ref('Developer')
</script>
```

```vue
<!-- UserCard.vue -->
<script setup>
// Props: recibidas del padre, solo lectura
const props = defineProps<{
  name: string
  role: string
}>()

// Estado: propiedad de este componente, lectura y escritura
const isExpanded = ref(false)
</script>

<template>
  <div>
    <h2>{{ name }} ({{ role }})</h2>
    <button @click="isExpanded = !isExpanded">
      {{ isExpanded ? 'Collapse' : 'Expand' }}
    </button>
    <p v-if="isExpanded">Profile details here...</p>
  </div>
</template>
```

## Comparativa

| | Props | Estado |
|---|---|---|
| Quién lo controla | El padre | El propio componente |
| Mutable | No (solo lectura) | Sí |
| Se declara con | `defineProps` | `ref()` / `reactive()` |
| Flujo de datos | De padre a hijo (unidireccional) | Interno |
| Dispara re-render | Sí, cuando el padre cambia el valor | Sí, cuando el componente lo cambia |

## Por qué las props son de solo lectura

Vue impone el flujo de datos unidireccional. Si un hijo pudiera modificar sus props, el estado del padre cambiaría sin que el padre lo supiera, haciendo el flujo de datos impredecible y los bugs difíciles de rastrear.

```ts
// Esto dispara un aviso en tiempo de ejecución
props.name = 'New name' // [Vue warn]: Attempting to mutate prop "name"
```

Cuando el hijo necesita cambiar un valor que pertenece al padre, debe emitir un evento:

```vue
<!-- Child -->
<script setup>
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ update: [value: number] }>()
</script>

<template>
  <button @click="emit('update', count + 1)">+1</button>
</template>

<!-- Parent -->
<Counter :count="total" @update="total = $event" />
```

## Cuándo usar cada uno

| Escenario | Usar |
|---|---|
| Configuración pasada desde el padre (label, color, size) | Props |
| Toggle de UI local al componente (abierto/cerrado, hover) | Estado |
| Valor de input compartido con el padre | Props + emit (o `v-model`) |
| Datos obtenidos dentro del componente | Estado |
| Datos obtenidos por el padre y mostrados por el hijo | Props |

Ver también: [¿Puedes inicializar el state con el valor de una prop?](/es/q/initialize-state-from-prop) · [¿Cómo funciona el sistema de reactividad de Vue 3?](/es/q/reactivity-system)

## Referencias

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Props — Vue guide](https://vuejs.org/guide/components/props.html)
- [Eventos de componente — Vue guide](https://vuejs.org/guide/components/events.html)
