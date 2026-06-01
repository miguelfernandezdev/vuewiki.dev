---
order: 109
title: "What are the key TypeScript utility types for Vue?"
difficulty: "advanced"
tags: ["typescript"]
---

Vue exports several utility types that help you type props, refs, components, and events correctly. Knowing them saves you from writing complex generics manually and gives you better IDE support.

## PropType

Forces a specific type on a runtime-declared prop. Needed only with the Options API or runtime prop declarations, not with type-based `defineProps`:

```ts
import type { PropType } from 'vue'

interface User {
  id: number
  name: string
}

export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    },
    status: {
      type: String as PropType<'active' | 'inactive'>,
      default: 'active'
    }
  }
})
```

With `<script setup>` and type-based props, you don't need `PropType` at all:

```ts
defineProps<{ user: User; status?: 'active' | 'inactive' }>()
```

## ExtractPropTypes / ExtractPublicPropTypes

Extract the resolved prop types from a runtime props object. Useful when you define props outside the component (e.g., for shared prop definitions):

```ts
import type { ExtractPropTypes, ExtractPublicPropTypes } from 'vue'

const buttonProps = {
  size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
  disabled: { type: Boolean, default: false }
} as const

// Internal type (what the component sees — defaults are resolved)
type InternalProps = ExtractPropTypes<typeof buttonProps>
// { size: 'sm' | 'md' | 'lg'; disabled: boolean }

// Public type (what the parent passes — optional props stay optional)
type PublicProps = ExtractPublicPropTypes<typeof buttonProps>
// { size?: 'sm' | 'md' | 'lg'; disabled?: boolean }
```

## ComponentPublicInstance

The type of a component instance as seen from the outside (template refs):

```ts
import type { ComponentPublicInstance } from 'vue'

const compRef = ref<ComponentPublicInstance | null>(null)
```

For a specific component, use `InstanceType`:

```ts
import MyForm from './MyForm.vue'

const formRef = ref<InstanceType<typeof MyForm> | null>(null)
```

`InstanceType<typeof Component>` gives you access to whatever the component exposes via `defineExpose`.

## MaybeRef / MaybeRefOrGetter

Common in composable parameters. Accept a value, a ref, or a getter:

```ts
import type { MaybeRef, MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}

// All valid:
useTitle('Static Title')
useTitle(ref('Reactive Title'))
useTitle(() => `Page ${page.value}`)
```

`MaybeRef<T>` accepts `T | Ref<T>`. `MaybeRefOrGetter<T>` also accepts `() => T`. Use `toValue()` to unwrap any of them.

## Ref / ComputedRef / ShallowRef

Explicit types for reactive references:

```ts
import type { Ref, ComputedRef, ShallowRef } from 'vue'

function useCounter(): { count: Ref<number>; doubled: ComputedRef<number> } {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)
  return { count, doubled }
}
```

Usually you don't need these because TypeScript infers them. They're useful for explicit return types on composables or function parameters.

## InjectionKey

Type-safe provide/inject:

```ts
import type { InjectionKey } from 'vue'

interface AuthContext {
  user: Ref<User | null>
  login: (credentials: Credentials) => Promise<void>
}

export const AUTH_KEY: InjectionKey<AuthContext> = Symbol('auth')

// Provider
provide(AUTH_KEY, { user, login })

// Consumer — fully typed, no cast needed
const auth = inject(AUTH_KEY)!
```

## VNode

The type of a virtual DOM node. Useful when working with render functions or slot manipulation:

```ts
import type { VNode } from 'vue'

function renderItems(items: string[]): VNode[] {
  return items.map(item => h('li', item))
}
```

## Quick reference

| Type | Use case |
|---|---|
| `PropType<T>` | Type a runtime prop declaration |
| `ExtractPropTypes<T>` | Get resolved prop types (internal, defaults applied) |
| `ExtractPublicPropTypes<T>` | Get prop types as seen by the parent |
| `InstanceType<typeof Comp>` | Type a template ref to a child component |
| `ComponentPublicInstance` | Generic component ref type |
| `MaybeRef<T>` | Composable param that accepts `T` or `Ref<T>` |
| `MaybeRefOrGetter<T>` | Also accepts `() => T` |
| `InjectionKey<T>` | Type-safe provide/inject key |
| `Ref<T>` / `ComputedRef<T>` | Explicit ref types for function signatures |
| `VNode` | Virtual DOM node (render functions) |
