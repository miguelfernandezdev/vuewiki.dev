---
order: 131
title: "¿Puedes inicializar el state con el valor de una prop? ¿Qué ocurre?"
difficulty: "beginner"
tags: ["reactivity", "components", "watchers", "v-model"]
---

Sí, puedes usar una prop como valor inicial para el state local. El [ref](https://vuejs.org/api/reactivity-core.html#ref) local obtiene el valor actual de la prop en el momento de su creación y luego se vuelve independiente. Los cambios en la prop NO actualizan el state local, y los cambios en el state local NO afectan al padre. Es algo intencional: crea una copia unidireccional.

## Patrón básico

```vue
<script setup>
const props = defineProps<{ initialCount: number }>()

const count = ref(props.initialCount)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

`count` comienza con el valor que tenga `initialCount` cuando el componente se monta. Después de eso, `count` lleva su propia vida. El padre puede cambiar `initialCount` a 999 y el `count` local no se moverá.

## Cuándo es el enfoque correcto

Este patrón funciona cuando la prop es realmente un valor semilla, no un binding en vivo:

```vue
<!-- Padre -->
<UserForm :initial-name="user.name" @save="updateUser" />
```

```vue
<!-- UserForm.vue -->
<script setup>
const props = defineProps<{ initialName: string }>()
const emit = defineEmits<{ save: [name: string] }>()

const name = ref(props.initialName)
</script>

<template>
  <input v-model="name" />
  <button @click="emit('save', name)">Guardar</button>
</template>
```

El formulario edita una copia local. Los datos del padre solo se actualizan cuando el usuario guarda explícitamente.

## El error: esperar que permanezca sincronizado

```vue
<script setup>
const props = defineProps<{ count: number }>()

// Este ref copia el valor UNA SOLA VEZ
const localCount = ref(props.count)

// Cuando el padre cambia props.count, localCount no se mueve
</script>
```

Si necesitas que el valor local siga la prop, usa `computed` o `watch`:

```vue
<script setup>
const props = defineProps<{ count: number }>()

// Opción 1: valor derivado de solo lectura
const doubled = computed(() => props.count * 2)

// Opción 2: copia local que se reinicia cuando cambia la prop
const localCount = ref(props.count)
watch(() => props.count, (newVal) => {
  localCount.value = newVal
})
</script>
```

## ¿Por qué no usar la prop directamente?

Vue impone el flujo de datos unidireccional. Las props son de solo lectura:

```vue
<script setup>
const props = defineProps<{ count: number }>()

// Esto genera un warning en desarrollo
props.count++ // [Vue warn]: Set operation on key "count" of target is invalid
</script>
```

Mutar una prop directamente cambiaría los datos del padre desde el hijo, haciendo imposible rastrear de dónde vienen los cambios de state. Los tres patrones válidos son:

1. **Usar la prop directamente** (solo lectura): <code v-pre>{{ props.count }}</code>
2. **Derivar un valor**: `computed(() => props.count * 2)`
3. **Copiar al state local**: `ref(props.count)` para formularios editables

## Convención de nombres habitual

Usa el prefijo `initial` o `default` en la prop para indicar que es una semilla, no un binding en vivo:

```vue
<script setup>
const props = defineProps<{
  initialQuery: string
  defaultPageSize: number
}>()

const query = ref(props.initialQuery)
const pageSize = ref(props.defaultPageSize)
</script>
```

Esto deja claro a cualquier persona que lea el template del padre: `initial-query="vue"` significa que el hijo empezará con "vue" pero puede divergir.

## Props de objeto: la trampa de la referencia

Al copiar una prop de objeto, un `ref()` superficial copia la referencia, no los datos:

```vue
<script setup>
const props = defineProps<{ initialFilters: { category: string; sort: string } }>()

// MAL: localFilters.value y props.initialFilters apuntan al mismo objeto
const localFilters = ref(props.initialFilters)
localFilters.value.category = 'new' // también muta el objeto del padre

// BIEN: spread para crear una copia real
const localFilters = ref({ ...props.initialFilters })
</script>
```

Para objetos anidados, usa `structuredClone(props.initialFilters)` o una utilidad de copia profunda.

Ver también: [¿Cuál es la diferencia entre props y estado en Vue?](/es/q/props-vs-state) · [¿Por qué pierdo reactividad al desestructurar un objeto reactive?](/es/q/reactive-destructuring-gotcha)

## Referencias

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [watch() — Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [Props — Vue guide](https://vuejs.org/guide/components/props.html)
