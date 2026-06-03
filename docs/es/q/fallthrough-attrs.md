---
order: 38
title: '¿Qué son los fallthrough attributes?'
difficulty: 'intermediate'
tags: ['components', 'watchers']
summary: 'Los atributos no declarados en defineProps o defineEmits (class, style, id, aria-*, listeners) se reenvían automáticamente al elemento raíz.'
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

<PlaygroundLink code="<!-- Padre -->
<BaseButton class=&quot;primary&quot; data-testid=&quot;submit&quot; @click=&quot;save&quot;>
  Save
</BaseButton>
&#10;<!-- BaseButton.vue (class y click no están declarados) -->
<template>
  <button><slot /></button>
</template>
&#10;<!-- HTML renderizado: los attrs caen al <button> raíz -->
<button class=&quot;primary&quot; data-testid=&quot;submit&quot;>Save</button>" />

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

<PlaygroundLink code="<script setup>
defineOptions({ inheritAttrs: false })
</script>
&#10;<template>
  <div class=&quot;wrapper&quot;>
    <!-- Reenviar todos los attrs al input interior, no al wrapper -->
    <input v-bind=&quot;$attrs&quot; />
    <span class=&quot;icon&quot;>🔍</span>
  </div>
</template>" />

    <span class=&quot;icon&quot;>🔍</span>
  </div>
</template>" />

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

<PlaygroundLink code="<script setup>
import { useAttrs } from 'vue'
&#10;defineOptions({ inheritAttrs: false })
&#10;const attrs = useAttrs()
&#10;function handleClick(event: MouseEvent) {
  console.log('internal logic first')
  // Reenviar el listener de click original
  const onClick = attrs.onClick as ((e: MouseEvent) => void) | undefined
  onClick?.(event)
}
</script>
&#10;<template>
  <button @click=&quot;handleClick&quot;><slot /></button>
</template>" />

## Nombres de atributos en $attrs

| Template del padre   | Clave en `$attrs`     |
| -------------------- | --------------------- |
| `class="foo"`        | `attrs.class`         |
| `data-id="123"`      | `attrs['data-id']`    |
| `aria-label="..."`   | `attrs['aria-label']` |
| `@click="fn"`        | `attrs.onClick`       |
| `@custom-event="fn"` | `attrs.onCustomEvent` |

Los atributos con guiones requieren notación de corchetes. Los listeners de eventos se convierten en claves camelCase `onX`.

## useAttrs no es reactivo

`useAttrs()` siempre devuelve los últimos valores, pero los watchers no lo rastrean:

```ts
const attrs = useAttrs()

// Este watcher nunca se dispara al cambiar los attrs
watch(
  () => attrs.class,
  (val) => {
    /* código muerto */
  }
)

// Usa onBeforeUpdate en su lugar
onBeforeUpdate(() => {
  console.log('current attrs:', attrs)
})
```

Si necesitas reaccionar al cambio de un atributo específico, promuévelo a prop con `defineProps`. Las props son completamente reactivas.

## Cuándo importan los fallthrough attrs

| Escenario                                           | Qué hacer                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| Wrapper sobre un elemento nativo (input, button)    | Dejar que los attrs pasen, o vincular `$attrs` al elemento correcto |
| Componente con múltiples raíces                     | Establecer `inheritAttrs: false`, vincular `$attrs` explícitamente  |
| Necesitas interceptar un evento antes de reenviarlo | Leer `attrs.onClick`, llamarlo después de tu lógica                 |
| Necesitas acceso reactivo a un attr específico      | Promuévelo a prop declarada                                         |

Ver también: [¿Qué es defineExpose?](/es/q/define-expose) · [¿Qué son los slots?](/es/q/slots) · [¿Qué son los componentes funcionales?](/es/q/functional-components)

## Referencias

- [Fallthrough Attributes](https://vuejs.org/guide/components/attrs.html) - Vue.js docs
- [useAttrs()](https://vuejs.org/api/composition-api-helpers.html#useattrs) - Vue.js docs
- [inheritAttrs](https://vuejs.org/api/options-misc.html#inheritattrs) - Vue.js docs
