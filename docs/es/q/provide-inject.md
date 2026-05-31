---
order: 14
title: "¿Qué es Provide/Inject?"
difficulty: "intermediate"
tags: ["components", "composition-api"]
---

Inyección de dependencias en Vue. Permite pasar datos desde un ancestro a cualquier descendiente sin prop drilling.

```ts
// Padre/Ancestro
import { provide, ref } from 'vue'
import type { InjectionKey } from 'vue'

// Clave tipada para mayor seguridad
export const UserKey: InjectionKey<Ref<User>> = Symbol('user')

const user = ref<User>({ name: 'John' })
provide(UserKey, user)
```

```ts
// Cualquier descendiente (a cualquier nivel de profundidad)
import { inject } from 'vue'
import { UserKey } from '@/keys'

const user = inject(UserKey) // Ref<User> | undefined
// Con valor por defecto:
const user = inject(UserKey, ref({ name: 'Guest' }))
```

**Casos de uso:** Tema visual, contexto de autenticación, configuración global, contexto de tablas o formularios.
