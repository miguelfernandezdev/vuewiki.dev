---
order: 105
title: 'How do you declare props with TypeScript in Vue 3?'
difficulty: 'beginner'
tags: ['typescript', 'components']
summary: 'Pass a TypeScript interface to defineProps as a generic: defineProps<{ title: string }>. Vue generates runtime checks from your types.'
---

In Vue 3 with `<script setup>`, you declare props using [`defineProps`](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits), a compiler macro that Vue processes at build time. You don't import it; it's available automatically inside `<script setup>`.

## Basic declaration

Pass a TypeScript type or interface to `defineProps` as a generic parameter. Vue generates the runtime prop checks from your types:

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

Optional props (marked with `?`) are allowed to be `undefined`. Required props cause a runtime warning if the parent doesn't provide them.

## Default values with withDefaults

Since you can't use the `default` option with the type-based syntax, Vue provides [`withDefaults`](https://vuejs.org/api/sfc-script-setup.html#default-props-values-when-using-type-declaration):

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
// props.count is now `number` (not `number | undefined`)
// props.tags is now `string[]` (not `string[] | undefined`)
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
// props.count is now `number` (not `number | undefined`)
// props.tags is now `string[]` (not `string[] | undefined`)
</script>" />

For arrays and objects, use a factory function (`() => ['vue']`), same reason as `data()` in the Options API: each component instance needs its own copy.

## Reactive destructure (3.5+)

Since Vue 3.5, you can destructure props while keeping reactivity. Default values use standard JavaScript syntax:

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
  <!-- `title` and `count` are reactive — no `.value` needed in the template -->
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
  <!-- `title` and `count` are reactive — no `.value` needed in the template -->
  <h2>{{ title }}</h2>
</template>" />

This replaces `withDefaults` for most cases. The destructured variables are reactive in the template and in `watch`/`computed`, but if you pass them to a plain function, they're just values at that point.

## Complex types

Props can use unions, literal types, and imported interfaces:

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

There are [limitations on the types you can use](/q/defineprops-type-limitations). For example, you can't use conditional types or imported type aliases that resolve to complex generics in some cases.

## Why not the runtime syntax?

Vue also supports a runtime object syntax (`defineProps({ title: String })`) that doesn't need TypeScript. The type-based syntax is better because:

1. **IDE support**: types flow into the template, autocomplete works, refactoring catches all usages
2. **No duplication**: your TypeScript types ARE the prop definitions, not a parallel declaration
3. **Stricter**: union types, literal types, and complex shapes that the runtime syntax can't express

See also: [What are the limitations of defineProps types?](/q/defineprops-type-limitations) · [How do you emit events with TypeScript?](/q/emit-events-typescript) · [What is the difference between props and state?](/q/props-vs-state) · [Why does Vue warn when you mutate props?](/q/mutating-props-warning)

## References

- [Typing Component Props](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props) - Vue.js docs
- [defineProps()](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
- [Reactive Props Destructure](https://vuejs.org/guide/components/props.html#reactive-props-destructure) - Vue.js docs
