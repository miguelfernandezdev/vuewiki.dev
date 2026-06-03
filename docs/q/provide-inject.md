---
order: 26
title: "What is Provide/Inject?"
difficulty: "intermediate"
tags: ["components", "composition-api", "pinia", "provide-inject"]
summary: "provide sends data from a parent to any descendant without prop drilling. inject reads it. Works across any depth of nesting."
---

When a parent component needs to pass data to a deeply nested child, you'd normally have to pass props through every component in between, even if intermediate components don't use the data. This is called "prop drilling," and it makes your code fragile and hard to maintain.

[`provide`](https://vuejs.org/api/composition-api-dependency-injection.html#provide) and [`inject`](https://vuejs.org/api/composition-api-dependency-injection.html#inject) solve this. A parent provides data, and any descendant, no matter how deep, can inject it directly without any intermediate component knowing about it.

## How it works

```vue
<!-- GrandParent.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue'

const theme = ref('dark')
provide('theme', theme)
</script>
```

```vue
<!-- DeeplyNestedChild.vue (any depth below GrandParent) -->
<script setup lang="ts">
import { inject } from 'vue'

const theme = inject('theme') // 'dark' — no props passed through middle components
</script>
```

The provided value is reactive. When `theme` changes in the parent, every component that injected it updates automatically.

## Type-safe injection with InjectionKey

String keys work but don't give you type safety. Use `InjectionKey` for typed provide/inject:

```ts
// keys.ts
import type { InjectionKey, Ref } from 'vue'

interface User { name: string; role: string }

export const UserKey: InjectionKey<Ref<User>> = Symbol('user')
```

```ts
// Provider
import { provide, ref } from 'vue'
import { UserKey } from '@/keys'

const user = ref<User>({ name: 'John', role: 'admin' })
provide(UserKey, user)
```

```ts
// Consumer
import { inject } from 'vue'
import { UserKey } from '@/keys'

const user = inject(UserKey) // Ref<User> | undefined
const userWithDefault = inject(UserKey, ref({ name: 'Guest', role: 'viewer' })) // with default
```

## When to use it (and when not to)

**Good use cases:**
- Theme or locale shared across an entire app
- Auth/user state accessible deep in the tree
- Table or form context (a `<Table>` provides column config, child `<TableCell>` injects it)
- Plugin-style features (a toast manager, a modal manager)

**Bad use cases:**
- Passing data between siblings. provide/inject is parent-to-descendant only
- Replacing all props with inject. It makes components harder to test and understand because their dependencies are implicit
- Global state that many unrelated components read and write. Use [Pinia](https://pinia.vuejs.org/) instead

## Provide/Inject vs Props vs Pinia

| | Props | Provide/Inject | Pinia |
|---|---|---|---|
| Direction | Parent → child (1 level) | Ancestor → any descendant | Any component → any component |
| Explicit | Yes (visible in template) | No (implicit dependency) | Somewhat (import store) |
| Reactive | Yes | Yes | Yes |
| Best for | Direct parent-child data | Subtree-wide context | Global app state |

See also: [What is getCurrentInstance() and why should you avoid it?](/q/get-current-instance) · [What is a composable?](/q/what-is-a-composable)

## References

- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
- [provide()](https://vuejs.org/api/composition-api-dependency-injection.html#provide) - Vue.js docs
- [inject()](https://vuejs.org/api/composition-api-dependency-injection.html#inject) - Vue.js docs
