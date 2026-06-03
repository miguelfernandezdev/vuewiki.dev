---
order: 113
title: 'What are the limitations of type-based defineProps?'
difficulty: 'advanced'
tags: ['typescript', 'components']
summary: "Vue's compiler resolves types statically. Conditional types, deep mapped types, and ambient globals fail. Flatten complex types into explicit interfaces."
---

Type-based `defineProps<T>()` works with imported interfaces and type aliases since Vue 3.3, but some complex TypeScript patterns fail at compile time because Vue's compiler resolves types statically, not through the full TypeScript type system.

## What works

Simple interfaces, type aliases, union literals, and generics:

```ts
// types/props.ts
export interface User {
  id: number
  name: string
  email?: string
}

export type Status = 'pending' | 'active' | 'completed'
```

```vue
<script setup lang="ts">
import type { User, Status } from '@/types/props'

defineProps<{
  user: User
  status: Status
  items: string[]
}>()
</script>
```

Using an imported interface directly as the props type also works:

```vue
<script setup lang="ts">
import type { User } from '@/types/props'

defineProps<User>()
</script>
```

## What doesn't work

### Conditional types as the entire props shape

```ts
export type InputProps<T> = T extends string
  ? { value: string; onChange: (v: string) => void }
  : { value: number; onChange: (v: number) => void }
```

```vue
<script setup lang="ts">
// ERROR: Vue can't resolve conditional types for the props object
defineProps<InputProps<string>>()
</script>
```

**Fix:** resolve the type manually:

```vue
<script setup lang="ts">
interface StringInputProps {
  value: string
  onChange: (v: string) => void
}

defineProps<StringInputProps>()
</script>
```

### Complex mapped types

```ts
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
```

```vue
<script setup lang="ts">
// May fail or produce incorrect runtime declarations
defineProps<DeepReadonly<User>>()
</script>
```

**Fix:** flatten the type into an explicit interface:

```ts
export interface ReadonlyUser {
  readonly id: number
  readonly name: string
  readonly email?: string
}
```

### Global ambient types (no export)

```ts
// global.d.ts
interface AppConfig {
  theme: string
  locale: string
}
```

```vue
<script setup lang="ts">
// ERROR: "Unresolvable type reference"
defineProps<{ config: AppConfig }>()
</script>
```

**Fix:** use explicit exports and imports instead of ambient declarations:

```ts
// types/config.ts
export interface AppConfig {
  theme: string
  locale: string
}
```

### Types from node_modules (sometimes)

Some complex types from external packages can fail if they use advanced generics or conditional types internally. The workaround is the same: create a local interface that flattens the external type.

## The general rule

If Vue's compiler can statically resolve the type to a set of property names with concrete types, it works. If the type requires runtime evaluation, conditional branching, or recursive type resolution, it fails.

**Works:** interfaces, type aliases, union literals, `Pick`, `Omit`, `Partial`, `Required` (Vue 3.3+), simple generics.

**Fails:** conditional types (`T extends X ? A : B`), deeply recursive mapped types, ambient globals, some cross-package types.

## Dual script block workaround

For cases where you need complex type computation, resolve it in a regular `<script>` block:

```vue
<script lang="ts">
import type { ComplexGeneric } from '@/types'

type Resolved = ComplexGeneric<'variant-a'>
</script>

<script setup lang="ts">
defineProps<Resolved>()
</script>
```

The regular script block has full TypeScript access. The resolved type is then simple enough for `<script setup>` to handle.

## Version history

| Vue version | What's supported                                       |
| ----------- | ------------------------------------------------------ |
| 3.2         | Only inline types (no imports)                         |
| 3.3         | Imported interfaces, type aliases, enums               |
| 3.4+        | Better support for `Pick`, `Omit`, cross-file generics |

See also: [How do you declare props with TypeScript?](/q/props-with-typescript) · [How do generic components work?](/q/generic-components) · [What are the gotchas with withDefaults?](/q/withdefaults-gotchas)

## References

- [Typing Component Props](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props) - Vue.js docs
- [defineProps()](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
