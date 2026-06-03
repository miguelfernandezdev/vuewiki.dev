---
order: 110
title: '¿Cómo funciona withDefaults y cuáles son sus errores habituales?'
difficulty: 'intermediate'
tags: ['typescript', 'components']
summary: 'withDefaults provee valores por defecto para defineProps tipados. Trampa: defaults mutables (arrays, objetos) DEBEN usar funciones factory para evitar referencias compartidas.'
---

`withDefaults` proporciona valores por defecto para `defineProps` basado en tipos. El principal error: los defaults mutables (arrays, objetos) DEBEN usar funciones factory; de lo contrario, todas las instancias del componente comparten la misma referencia. Vue 3.5+ introduce defaults con desestructuración que gestionan esto automáticamente.

## Uso básico

```vue
<script setup lang="ts">
interface Props {
  title?: string
  count?: number
  items?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Untitled',
  count: 0,
  items: () => []
})
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
interface Props {
  title?: string
  count?: number
  items?: string[]
}
&#10;const props = withDefaults(defineProps<Props>(), {
  title: 'Untitled',
  count: 0,
  items: () => []
})
</script>" />

`withDefaults` solo se aplica a los props opcionales (los que tienen `?`). Los props requeridos no necesitan defaults.

## El problema del default mutable

Los arrays y objetos se pasan por referencia. Sin una función factory, cada instancia del componente obtiene el mismo objeto:

```vue
<script setup lang="ts">
// ERROR: todas las instancias comparten el mismo array
const props = withDefaults(defineProps<{ tags?: string[] }>(), {
  tags: ['default']
})
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
// ERROR: todas las instancias comparten el mismo array
const props = withDefaults(defineProps<{ tags?: string[] }>(), {
  tags: ['default']
})
</script>" />

Si una instancia del componente muta `tags`, todas las demás instancias ven el cambio. Esto causa bugs como "seleccionar una fila en una tabla la selecciona en todas las tablas".

## La solución: funciones factory

Envuelve los defaults mutables en una función flecha para que cada instancia obtenga una copia nueva:

```vue
<script setup lang="ts">
interface Props {
  title?: string
  disabled?: boolean
  items?: string[]
  config?: { theme: string; locale: string }
  selectedIds?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default', // primitivo, no necesita factory
  disabled: false, // primitivo, no necesita factory
  items: () => [], // array, factory necesaria
  config: () => ({
    // objeto, factory necesaria
    theme: 'light',
    locale: 'en'
  }),
  selectedIds: () => new Set() // Set, factory necesaria
})
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
interface Props {
  title?: string
  disabled?: boolean
  items?: string[]
  config?: { theme: string; locale: string }
  selectedIds?: Set<string>
}
&#10;const props = withDefaults(defineProps<Props>(), {
  title: 'Default', // primitivo, no necesita factory
  disabled: false, // primitivo, no necesita factory
  items: () => [], // array, factory necesaria
  config: () => ({
    // objeto, factory necesaria
    theme: 'light',
    locale: 'en'
  }),
  selectedIds: () => new Set() // Set, factory necesaria
})
</script>" />

## Cuándo necesitas una función factory

| Tipo          | Factory necesaria | Sintaxis del default |
| ------------- | ----------------- | -------------------- |
| `string`      | No                | `'hello'`            |
| `number`      | No                | `42`                 |
| `boolean`     | No                | `false`              |
| `null`        | No                | `null`               |
| `Array`       | Sí                | `() => []`           |
| `Object`      | Sí                | `() => ({})`         |
| `Map` / `Set` | Sí                | `() => new Map()`    |
| `Date`        | Sí                | `() => new Date()`   |

La regla: si `typeof value === 'object'`, usa una factory.

## Vue 3.5+: defaults con desestructuración

Vue 3.5 introdujo la desestructuración reactiva de props. Los defaults se escriben con la sintaxis de desestructuración estándar de JavaScript, y Vue gestiona automáticamente el aislamiento entre instancias:

```vue
<script setup lang="ts">
const {
  title = 'Untitled',
  count = 0,
  items = ['default'],
  config = { theme: 'light' }
} = defineProps<{
  title?: string
  count?: number
  items?: string[]
  config?: { theme: string }
}>()
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const {
  title = 'Untitled',
  count = 0,
  items = ['default'],
  config = { theme: 'light' }
} = defineProps<{
  title?: string
  count?: number
  items?: string[]
  config?: { theme: string }
}>()
</script>" />

Sin `withDefaults`, sin funciones factory. Cada instancia del componente obtiene su propia copia. Este es el enfoque recomendado en Vue 3.5+.

## withDefaults vs defaults con desestructuración

```vue
<!-- Vue 3.4 e inferior: withDefaults -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items?: string[]
    label?: string
  }>(),
  {
    items: () => [],
    label: 'Default'
  }
)
// acceso: props.items, props.label
</script>

<!-- Vue 3.5+: defaults con desestructuración -->
<script setup lang="ts">
const { items = [], label = 'Default' } = defineProps<{
  items?: string[]
  label?: string
}>()
// acceso: items, label (directamente, sin prefijo 'props.')
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const props = withDefaults(
  defineProps<{
    items?: string[]
    label?: string
  }>(),
  {
    items: () => [],
    label: 'Default'
  }
)
// acceso: props.items, props.label
</script>
&#10;<script setup lang=&quot;ts&quot;>
const { items = [], label = 'Default' } = defineProps<{
  items?: string[]
  label?: string
}>()
// acceso: items, label (directamente, sin prefijo 'props.')
</script>" />

Ambos enfoques son válidos. `withDefaults` te da un único objeto `props`. La desestructuración te da variables individuales. En Vue 3.5+, la desestructuración es más simple y evita por completo el error habitual de las funciones factory.

Ver también: [¿Cómo declarar props con TypeScript?](/es/q/props-with-typescript) · [¿Cuáles son las limitaciones de los tipos en defineProps?](/es/q/defineprops-type-limitations)

## Referencias

- [Default Props Values](https://vuejs.org/api/sfc-script-setup.html#default-props-values-when-using-type-declaration) - Vue.js docs
- [Reactive Props Destructure](https://vuejs.org/guide/components/props.html#reactive-props-destructure) - Vue.js docs
