---
order: 50
title: "¿Cuáles son los lifecycle hooks en Vue 3?"
difficulty: "beginner"
tags: ["composition-api", "lifecycle"]
---

Los lifecycle hooks permiten ejecutar código en momentos concretos de la vida de un componente: cuando se crea, cuando se monta en el DOM, cuando se actualiza o cuando se destruye. En la Composition API, los registras como funciones dentro de `<script setup>`.

## Los hooks principales

```ts
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

onBeforeMount(() => {
  // El DOM todavía no está disponible
})

onMounted(() => {
  // El DOM está listo; es seguro acceder a template refs, iniciar timers, obtener datos
})

onBeforeUpdate(() => {
  // El state reactivo cambió, el DOM todavía no se ha re-renderizado
})

onUpdated(() => {
  // El DOM se ha re-renderizado con el nuevo state
})

onBeforeUnmount(() => {
  // El componente sigue siendo funcional; limpia antes de la eliminación
})

onUnmounted(() => {
  // El componente ha sido eliminado del DOM; todos los watchers han parado
})
```

## Flujo del lifecycle

```
setup()
  │
  ├── onBeforeMount
  ├── onMounted          ← DOM listo
  │
  │   (cambios en el state reactivo)
  ├── onBeforeUpdate
  ├── onUpdated          ← DOM re-renderizado
  │
  │   (componente eliminado)
  ├── onBeforeUnmount
  └── onUnmounted        ← limpieza completa
```

## Qué hook usar para cada tarea

| Tarea | Hook |
|---|---|
| Obtener datos iniciales | `onMounted` |
| Acceder a template refs | `onMounted` |
| Iniciar un timer o listener | `onMounted` (limpiar en `onUnmounted`) |
| Reaccionar a cambios del DOM tras actualización | `onUpdated` |
| Limpiar timers, listeners, suscripciones | `onUnmounted` |

## Patrón habitual: setup y limpieza

```ts
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

## Equivalente en Options API

Si ves código antiguo con Options API, la correspondencia es directa:

| Composition API | Options API |
|---|---|
| `onBeforeMount` | `beforeMount` |
| `onMounted` | `mounted` |
| `onBeforeUpdate` | `beforeUpdate` |
| `onUpdated` | `updated` |
| `onBeforeUnmount` | `beforeUnmount` |
| `onUnmounted` | `unmounted` |

No existe `onCreated` ni `onBeforeCreate` en la Composition API. El código que iría ahí se ejecuta directamente en `setup()` (o al nivel superior de `<script setup>`), ya que el propio setup se ejecuta en el momento de la creación.
