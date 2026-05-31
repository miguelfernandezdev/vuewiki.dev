---
order: 14
title: "What is Provide/Inject?"
difficulty: "intermediate"
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
