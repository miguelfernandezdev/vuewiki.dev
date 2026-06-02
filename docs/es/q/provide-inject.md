---
order: 26
title: "¿Qué es Provide/Inject?"
difficulty: "intermediate"
tags: ["components", "composition-api", "pinia", "provide-inject"]
---

Cuando un componente padre necesita pasar datos a un hijo profundamente anidado, normalmente tendrías que pasar props a través de cada componente intermedio, aunque esos componentes no usen los datos. Esto se llama "prop drilling", y hace el código frágil y difícil de mantener.

[`provide`](https://vuejs.org/api/composition-api-dependency-injection.html#provide) e [`inject`](https://vuejs.org/api/composition-api-dependency-injection.html#inject) resuelven esto. Un padre provee datos, y cualquier descendiente —sin importar la profundidad— puede inyectarlos directamente sin que ningún componente intermedio sepa de ellos.

## Cómo funciona

```vue
<!-- GrandParent.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue'

const theme = ref('dark')
provide('theme', theme)
</script>
```

```vue
<!-- DeeplyNestedChild.vue (cualquier nivel por debajo de GrandParent) -->
<script setup lang="ts">
import { inject } from 'vue'

const theme = inject('theme') // 'dark' — sin props pasadas por componentes intermedios
</script>
```

El valor provisto es reactivo. Cuando `theme` cambia en el padre, cada componente que lo inyectó se actualiza automáticamente.

## Inyección tipada con InjectionKey

Las claves de string funcionan pero no ofrecen seguridad de tipos. Usa `InjectionKey` para provide/inject tipados:

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
const user = inject(UserKey, ref({ name: 'Guest', role: 'viewer' })) // con valor por defecto
```

## Cuándo usarlo (y cuándo no)

**Buenos casos de uso:**
- Tema o configuración regional compartida en toda la app
- Estado de autenticación/usuario accesible en lo profundo del árbol
- Contexto de tabla o formulario (un `<Table>` provee configuración de columnas, el `<TableCell>` hijo lo inyecta)
- Funcionalidades tipo plugin (un gestor de toasts, un gestor de modales)

**Malos casos de uso:**
- Pasar datos entre componentes hermanos — provide/inject es solo de ancestro a descendiente
- Reemplazar todas las props con inject — hace los componentes más difíciles de testear y entender porque sus dependencias son implícitas
- Estado global que muchos componentes no relacionados leen y escriben — usa [Pinia](https://pinia.vuejs.org/) en su lugar

## Provide/Inject vs Props vs Pinia

| | Props | Provide/Inject | Pinia |
|---|---|---|---|
| Dirección | Padre → hijo (1 nivel) | Ancestro → cualquier descendiente | Cualquier componente → cualquier componente |
| Explícito | Sí (visible en la plantilla) | No (dependencia implícita) | Parcialmente (importar store) |
| Reactivo | Sí | Sí | Sí |
| Mejor para | Datos padre-hijo directos | Contexto de un subárbol | Estado global de la app |

Ver también: [¿Qué es getCurrentInstance() y por qué deberías evitarlo?](/es/q/get-current-instance) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
- [provide()](https://vuejs.org/api/composition-api-dependency-injection.html#provide) - Vue.js docs
- [inject()](https://vuejs.org/api/composition-api-dependency-injection.html#inject) - Vue.js docs
