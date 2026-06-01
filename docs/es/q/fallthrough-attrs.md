---
order: 67
title: "¿Qué son los fallthrough attributes?"
difficulty: "intermediate"
tags: ["components"]
---

Los fallthrough attributes son props y listeners de eventos que se pasan a un componente sin estar declarados en `defineProps` ni en `defineEmits`. Vue los reenvía automáticamente al elemento raíz del componente. Esto incluye `class`, `style`, `id`, `data-*`, `aria-*` y listeners de eventos.

```vue
<!-- Padre -->
<BaseButton class="primary" data-testid="submit" @click="save">
  Save
</BaseButton>

<!-- BaseButton.vue (class y click no están declarados) -->
<template>
  <button><slot /></button>
</template>

<!-- HTML renderizado: los attrs caen al <button> raíz -->
<button class="primary" data-testid="submit">Save</button>
```

## Deshabilitar el fallthrough automático

Cuando un componente tiene múltiples elementos raíz, o necesitas aplicar los attrs a un elemento que no es el raíz, deshabilita la herencia y vincula `$attrs` manualmente:

```vue
<script setup>
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="wrapper">
    <!-- Reenviar todos los attrs al input interior, no al wrapper -->
    <input v-bind="$attrs" />
    <span class="icon">🔍</span>
  </div>
</template>
```

## Acceder a los attrs en el script

Usa `useAttrs()` para leer los fallthrough attributes en `<script setup>`:

```vue
<script setup>
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

function handleClick(event: MouseEvent) {
  console.log('internal logic first')
  // Reenviar el listener de click original
  const onClick = attrs.onClick as ((e: MouseEvent) => void) | undefined
  onClick?.(event)
}
</script>

<template>
  <button @click="handleClick"><slot /></button>
</template>
```

## Nombres de atributos en $attrs

| Template del padre | Clave en `$attrs` |
|---|---|
| `class="foo"` | `attrs.class` |
| `data-id="123"` | `attrs['data-id']` |
| `aria-label="..."` | `attrs['aria-label']` |
| `@click="fn"` | `attrs.onClick` |
| `@custom-event="fn"` | `attrs.onCustomEvent` |

Los atributos con guiones requieren notación de corchetes. Los listeners de eventos se convierten en claves camelCase `onX`.

## useAttrs no es reactivo

`useAttrs()` siempre devuelve los últimos valores, pero los watchers no lo rastrean:

```ts
const attrs = useAttrs()

// Este watcher nunca se dispara al cambiar los attrs
watch(() => attrs.class, (val) => { /* código muerto */ })

// Usa onUpdated en su lugar
onUpdated(() => {
  console.log('current attrs:', attrs)
})
```

Si necesitas reaccionar al cambio de un atributo específico, promuévelo a prop con `defineProps`. Las props son completamente reactivas.

## Cuándo importan los fallthrough attrs

| Escenario | Qué hacer |
|---|---|
| Wrapper sobre un elemento nativo (input, button) | Dejar que los attrs pasen, o vincular `$attrs` al elemento correcto |
| Componente con múltiples raíces | Establecer `inheritAttrs: false`, vincular `$attrs` explícitamente |
| Necesitas interceptar un evento antes de reenviarlo | Leer `attrs.onClick`, llamarlo después de tu lógica |
| Necesitas acceso reactivo a un attr específico | Promuévelo a prop declarada |
