---
order: 110
title: 'How does withDefaults work and what are its gotchas?'
difficulty: 'intermediate'
tags: ['typescript', 'components']
summary: 'withDefaults provides defaults for type-based defineProps. Gotcha: mutable defaults (arrays, objects) MUST use factory functions to avoid shared references.'
---

`withDefaults` provides default values for type-based `defineProps`. The main gotcha: mutable defaults (arrays, objects) MUST use factory functions, otherwise all component instances share the same reference. Vue 3.5+ introduces destructured defaults that handle this automatically.

## Basic usage

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

`withDefaults` only applies to optional props (the ones with `?`). Required props don't need defaults.

## The mutable default problem

Arrays and objects are passed by reference. Without a factory function, every instance of the component gets the same object:

```vue
<script setup lang="ts">
// BUG: all instances share the same array
const props = withDefaults(defineProps<{ tags?: string[] }>(), {
  tags: ['default']
})
</script>
```

If one component instance mutates `tags`, every other instance sees the change. This causes bugs like "selecting a row in one table selects it in all tables."

## The fix: factory functions

Wrap mutable defaults in an arrow function so each instance gets a fresh copy:

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
  title: 'Default', // primitive — no factory needed
  disabled: false, // primitive — no factory needed
  items: () => [], // array — factory required
  config: () => ({
    // object — factory required
    theme: 'light',
    locale: 'en'
  }),
  selectedIds: () => new Set() // Set — factory required
})
</script>
```

## When you need a factory function

| Type          | Factory needed | Default syntax     |
| ------------- | -------------- | ------------------ |
| `string`      | No             | `'hello'`          |
| `number`      | No             | `42`               |
| `boolean`     | No             | `false`            |
| `null`        | No             | `null`             |
| `Array`       | Yes            | `() => []`         |
| `Object`      | Yes            | `() => ({})`       |
| `Map` / `Set` | Yes            | `() => new Map()`  |
| `Date`        | Yes            | `() => new Date()` |

The rule: if `typeof value === 'object'`, use a factory.

## Vue 3.5+: destructured defaults

Vue 3.5 introduced reactive props destructuring. Defaults are written with standard JavaScript destructuring syntax, and Vue handles instance isolation automatically:

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

No `withDefaults`, no factory functions. Each component instance gets its own copy. This is the recommended approach on Vue 3.5+.

## withDefaults vs destructured defaults

```vue
<!-- Vue 3.4 and below: withDefaults -->
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
// access: props.items, props.label
</script>

<!-- Vue 3.5+: destructured defaults -->
<script setup lang="ts">
const { items = [], label = 'Default' } = defineProps<{
  items?: string[]
  label?: string
}>()
// access: items, label (directly, no 'props.' prefix)
</script>
```

Both approaches are valid. `withDefaults` gives you a single `props` object. Destructuring gives you individual variables. On Vue 3.5+, destructuring is simpler and avoids the factory function footgun entirely.

See also: [How do you declare props with TypeScript?](/q/props-with-typescript) · [What are the limitations of defineProps types?](/q/defineprops-type-limitations)

## References

- [Default Props Values](https://vuejs.org/api/sfc-script-setup.html#default-props-values-when-using-type-declaration) - Vue.js docs
- [Reactive Props Destructure](https://vuejs.org/guide/components/props.html#reactive-props-destructure) - Vue.js docs
