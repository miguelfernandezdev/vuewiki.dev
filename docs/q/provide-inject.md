---
order: 14
title: "What is Provide/Inject?"
difficulty: "intermediate"
tags: ["components", "composition-api"]
---

Dependency injection in Vue. Allows passing data from an ancestor to any descendant without prop drilling.

```ts
// Parent/Ancestor
import { provide, ref } from 'vue'
import type { InjectionKey } from 'vue'

// Typed key for safety
export const UserKey: InjectionKey<Ref<User>> = Symbol('user')

const user = ref<User>({ name: 'John' })
provide(UserKey, user)
```

```ts
// Any descendant (at any depth)
import { inject } from 'vue'
import { UserKey } from '@/keys'

const user = inject(UserKey) // Ref<User> | undefined
// With default value:
const user = inject(UserKey, ref({ name: 'Guest' }))
```

**Use cases:** Theme, auth context, global config, table/form context.

[`provide`](https://vuejs.org/api/composition-api-dependency-injection.html#provide) makes data available to the entire subtree. [`inject`](https://vuejs.org/api/composition-api-dependency-injection.html#inject) retrieves it in any descendant.

See also: [What is getCurrentInstance() and why should you avoid it?](/q/get-current-instance) · [What is a composable?](/q/what-is-a-composable)

## References

- [provide](https://vuejs.org/api/composition-api-dependency-injection.html#provide) - Vue.js docs
- [inject](https://vuejs.org/api/composition-api-dependency-injection.html#inject) - Vue.js docs
- [Provide / Inject guide](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
