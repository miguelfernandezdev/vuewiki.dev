---
order: 77
title: "¿Qué son readonly y shallowReadonly?"
difficulty: "intermediate"
tags: ["reactivity", "provide-inject"]
---

`readonly()` crea un proxy reactivo profundamente inmutable. Se pueden leer todas las propiedades y siguen siendo reactivas ([computed](https://vuejs.org/api/reactivity-core.html#computed) y watchers continúan registrando cambios de la fuente original), pero cualquier intento de mutarlas genera un aviso en desarrollo y falla silenciosamente en producción. `shallowReadonly()` hace lo mismo pero solo en el primer nivel: los objetos anidados siguen siendo mutables.

## readonly

```ts
import { reactive, readonly } from 'vue'

const state = reactive({ count: 0, nested: { value: 'hello' } })
const readonlyState = readonly(state)

readonlyState.count++ // [Vue warn]: Set operation on key "count" failed: target is readonly
readonlyState.nested.value = 'world' // [Vue warn]: mismo aviso, readonly profundo

state.count++ // funciona, y readonlyState.count refleja el cambio
```

`readonlyState` es una vista de solo lectura de `state`. Sigue la misma fuente reactiva, así que cuando `state.count` cambia, cualquier componente que observe `readonlyState.count` se re-renderiza. Pero no se puede escribir a través del proxy readonly.

## shallowReadonly

```ts
import { reactive, shallowReadonly } from 'vue'

const state = reactive({ count: 0, nested: { value: 'hello' } })
const shallow = shallowReadonly(state)

shallow.count++ // [Vue warn]: readonly
shallow.nested.value = 'world' // funciona — las propiedades anidadas NO son readonly
```

Solo las propiedades raíz están protegidas. Los objetos anidados son las mismas referencias reactivas que el original, y las mutaciones pasan sin avisos.

## El caso de uso principal: exponer estado del store de forma segura

El uso más habitual de `readonly` es en composables o stores donde se quiere que los consumidores puedan leer el estado pero no modificarlo directamente:

```ts
// composables/useAuth.ts
const user = ref<User | null>(null)
const isAuthenticated = computed(() => user.value !== null)

async function login(credentials: Credentials) {
  user.value = await $fetch('/api/login', {
    method: 'POST',
    body: credentials
  })
}

function logout() {
  user.value = null
}

export function useAuth() {
  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout
  }
}
```

Los componentes pueden leer `user` y registrar cambios, pero no pueden hacer `user.value = fakeUser`. Deben pasar por `login()` y `logout()`, lo que garantiza un único lugar donde ocurren las mutaciones.

## provide/inject con readonly

Al pasar estado reactivo por el árbol de componentes, envolverlo en `readonly` para evitar que los componentes hijos muten el estado del padre:

```vue
<!-- Parent.vue -->
<script setup>
const config = reactive({
  theme: 'dark',
  locale: 'en'
})

provide('config', readonly(config))
provide('updateConfig', (patch: Partial<typeof config>) => {
  Object.assign(config, patch)
})
</script>
```

```vue
<!-- DeepChild.vue -->
<script setup>
const config = inject<Readonly<{ theme: string; locale: string }>>('config')
const updateConfig = inject<(patch: any) => void>('updateConfig')

// config.theme = 'light' // aviso — readonly
updateConfig({ theme: 'light' }) // funciona — pasa por la función del padre
</script>
```

Esto impone el flujo de datos unidireccional a través del árbol de provide/inject, similar a cómo las props son de solo lectura.

## Cuándo usar cada uno

| Escenario | Usar |
|---|---|
| Exponer estado desde un composable | `readonly(state)` |
| Proveer datos reactivos a descendientes | `readonly(state)` vía `provide` |
| Objeto de configuración grande donde solo importa el primer nivel | `shallowReadonly(config)` |
| Objeto de terceros con estado anidado que no se puede controlar | `shallowReadonly(instance)` |
| Datos inmutables que nunca cambian | `Object.freeze` (sin reactividad) |

## readonly vs Object.freeze

| | `readonly` | `Object.freeze` |
|---|---|---|
| Reactivo | Sí, registra la fuente | No, omite la reactividad completamente |
| Prevención de mutación | Aviso en dev, fallo silencioso en prod | TypeError en modo estricto |
| Profundidad | Profundo (todas las propiedades anidadas) | Superficial (hay que congelar recursivamente) |
| ¿Se puede mutar la fuente? | Sí, a través de la referencia original | No, el objeto en sí está congelado |
| Caso de uso | Acceso controlado a estado activo | Optimización de datos estáticos |

La diferencia clave: `readonly` crea una vista de solo lectura de datos que pueden seguir cambiando a través de la referencia original. `Object.freeze` hace los datos permanentemente inmutables para todos.

Ver también: [¿Qué ocurre cuando usas Object.freeze() en datos reactivos?](/es/q/object-freeze-reactive) · [¿Qué es el problema de identidad del proxy en reactividad?](/es/q/proxy-identity-hazard)

## Referencias

- [readonly() — Vue docs](https://vuejs.org/api/reactivity-core.html#readonly)
- [shallowReadonly() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#shallowreadonly)
- [provide / inject — Vue guide](https://vuejs.org/guide/components/provide-inject.html)
