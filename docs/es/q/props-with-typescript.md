---
order: 105
title: '¿Cómo se declaran props con TypeScript en Vue 3?'
difficulty: 'beginner'
tags: ['typescript', 'components']
summary: 'Pasa una interfaz TypeScript a defineProps como genérico: defineProps<{ title: string }>. Vue genera validaciones en runtime desde tus tipos.'
---

En Vue 3 con `<script setup>`, declaras props usando [`defineProps`](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits), una macro del compilador que Vue procesa en tiempo de compilación. No se importa; está disponible automáticamente dentro de `<script setup>`.

## Declaración básica

Pasa un tipo o interfaz de TypeScript a `defineProps` como parámetro genérico. Vue genera las validaciones de props en tiempo de ejecución a partir de tus tipos:

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = defineProps<Props>()
</script>

<template>
  <h2>{{ props.title }}</h2>
  <span>{{ props.count }} items</span>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
interface Props {
title: string
count?: number
items: string[]
}
&#10;const props = defineProps<Props>()
</script>
&#10;<template>

  <h2>{{ props.title }}</h2>
  <span>{{ props.count }} items</span>
</template>" />

Las props opcionales (marcadas con `?`) pueden ser `undefined`. Las props requeridas generan un warning en tiempo de ejecución si el componente padre no las proporciona.

## Valores por defecto con withDefaults

Como no puedes usar la opción `default` con la sintaxis basada en tipos, Vue proporciona [`withDefaults`](https://vuejs.org/api/sfc-script-setup.html#default-props-values-when-using-type-declaration):

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  tags: () => ['vue']
})
// props.count ahora es `number` (no `number | undefined`)
// props.tags ahora es `string[]` (no `string[] | undefined`)
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
interface Props {
  title: string
  count?: number
  tags?: string[]
}
&#10;const props = withDefaults(defineProps<Props>(), {
  count: 0,
  tags: () => ['vue']
})
// props.count ahora es `number` (no `number | undefined`)
// props.tags ahora es `string[]` (no `string[] | undefined`)
</script>" />

Para arrays y objetos, usa una función factoría (`() => ['vue']`), misma razón que `data()` en la Options API: cada instancia del componente necesita su propia copia.

## Destructuración reactiva (3.5+)

Desde Vue 3.5, puedes destructurar props manteniendo la reactividad. Los valores por defecto usan sintaxis estándar de JavaScript:

```vue
<script setup lang="ts">
const {
  title,
  count = 0,
  tags = ['vue']
} = defineProps<{
  title: string
  count?: number
  tags?: string[]
}>()
</script>

<template>
  <!-- `title` y `count` son reactivos — no necesitan `.value` en el template -->
  <h2>{{ title }}</h2>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const {
title,
count = 0,
tags = ['vue']
} = defineProps<{
title: string
count?: number
tags?: string[]
}>()
</script>
&#10;<template>

  <!-- `title` y `count` son reactivos — no necesitan `.value` en el template -->
  <h2>{{ title }}</h2>
</template>" />

Esto reemplaza `withDefaults` en la mayoría de casos. Las variables destructuradas son reactivas en el template y en `watch`/`computed`, pero si las pasas a una función normal, son solo valores en ese momento.

## Tipos complejos

Las props pueden usar uniones, tipos literales e interfaces importadas:

```vue
<script setup lang="ts">
import type { User } from '@/types'

interface Props {
  user: User
  status: 'active' | 'inactive' | 'pending'
  onUpdate?: (user: User) => void
}

const props = defineProps<Props>()
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import type { User } from '@/types'
&#10;interface Props {
  user: User
  status: 'active' | 'inactive' | 'pending'
  onUpdate?: (user: User) => void
}
&#10;const props = defineProps<Props>()
</script>" />

Hay [limitaciones en los tipos que puedes usar](/es/q/defineprops-type-limitations). Por ejemplo, no puedes usar tipos condicionales o alias de tipos importados que resuelven a genéricos complejos en algunos casos.

## ¿Por qué no la sintaxis runtime?

Vue también soporta una sintaxis de objeto en runtime (`defineProps({ title: String })`) que no necesita TypeScript. La sintaxis basada en tipos es mejor porque:

1. **Soporte del IDE**: los tipos fluyen al template, el autocompletado funciona, las refactorizaciones capturan todos los usos
2. **Sin duplicación**: tus tipos de TypeScript SON las definiciones de props, no una declaración paralela
3. **Más estricta**: tipos unión, tipos literales y formas complejas que la sintaxis runtime no puede expresar

Ver también: [¿Cuáles son las limitaciones de tipos en defineProps?](/es/q/defineprops-type-limitations) · [¿Cómo se emiten eventos con TypeScript?](/es/q/emit-events-typescript) · [¿Cuál es la diferencia entre props y estado?](/es/q/props-vs-state) · [¿Por qué Vue avisa al mutar props?](/es/q/mutating-props-warning)

## Referencias

- [Typing Component Props](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props) - Vue.js docs
- [defineProps()](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
- [Reactive Props Destructure](https://vuejs.org/guide/components/props.html#reactive-props-destructure) - Vue.js docs
