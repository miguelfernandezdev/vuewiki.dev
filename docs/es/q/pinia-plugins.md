---
order: 101
title: '¿Qué son los plugins de Pinia y cómo se crea uno?'
difficulty: 'advanced'
tags: ['state-management', 'architecture', 'pinia']
summary: 'Una función que se ejecuta por cada store creado. Úsalos para persistencia en localStorage, logging, propiedades compartidas o wrappers de actions.'
---

Los plugins de Pinia permiten añadir comportamiento a todos los stores globalmente: persistir estado en localStorage, agregar propiedades compartidas, envolver acciones con logging, sincronizar con sistemas externos. Un plugin es una función que recibe un objeto de contexto y se ejecuta una vez por cada creación de store.

## Crear un plugin

Un plugin es una función que Pinia llama para cada store:

```ts
import { type PiniaPlugin } from 'pinia'

const myPlugin: PiniaPlugin = (context) => {
  // context.store  — la instancia del store
  // context.pinia  — la instancia raíz de Pinia
  // context.app    — la instancia de la app Vue
  // context.options — las opciones pasadas a defineStore
}
```

Registrarlo antes de montar la app:

```ts
const pinia = createPinia()
pinia.use(myPlugin)
app.use(pinia)
```

## Ejemplo: persistencia en localStorage

```ts
function piniaLocalStorage(): PiniaPlugin {
  return ({ store }) => {
    const saved = localStorage.getItem(store.$id)
    if (saved) {
      store.$patch(JSON.parse(saved))
    }

    store.$subscribe((mutation, state) => {
      localStorage.setItem(store.$id, JSON.stringify(state))
    })
  }
}

const pinia = createPinia()
pinia.use(piniaLocalStorage())
```

Ahora todos los stores guardan y restauran su estado automáticamente desde localStorage.

## Ejemplo: logger de acciones

```ts
function piniaLogger(): PiniaPlugin {
  return ({ store }) => {
    store.$onAction(({ name, args, after, onError }) => {
      const start = performance.now()

      after(() => {
        const duration = (performance.now() - start).toFixed(1)
        console.log(
          `[${store.$id}] ${name}(${JSON.stringify(args)}) — ${duration}ms`
        )
      })

      onError((error) => {
        console.error(`[${store.$id}] ${name} failed:`, error)
      })
    })
  }
}
```

## Añadir propiedades a todos los stores

Devolver un objeto desde el plugin extiende todos los stores:

```ts
function piniaCreatedAt(): PiniaPlugin {
  return ({ store }) => {
    store.createdAt = new Date()
    return { createdAt: store.createdAt }
  }
}
```

Para TypeScript, ampliar la interfaz del store:

```ts
declare module 'pinia' {
  export interface PiniaCustomProperties {
    createdAt: Date
  }
}
```

Ahora `store.createdAt` está disponible y tipado en todos los stores.

## Añadir estado a todos los stores

Usar `ref` para añadir estado reactivo que quede incluido en devtools y serialización:

```ts
function piniaLoadingState(): PiniaPlugin {
  return ({ store }) => {
    const isLoading = ref(false)

    store.$onAction(({ after, onError }) => {
      isLoading.value = true
      after(() => {
        isLoading.value = false
      })
      onError(() => {
        isLoading.value = false
      })
    })

    return { isLoading }
  }
}
```

```vue
<script setup>
const userStore = useUserStore()
// isLoading está disponible en todos los stores
</script>

<template>
  <Spinner v-if="userStore.isLoading" />
</template>
```

<PlaygroundLink code="<script setup>
const userStore = useUserStore()
// isLoading está disponible en todos los stores
</script>
&#10;<template>
  <Spinner v-if=&quot;userStore.isLoading&quot; />
</template>" />

## Aplicar lógica solo a stores específicos

Comprobar `store.$id` o usar el objeto options para aplicar lógica de forma selectiva:

```ts
function piniaDebounce(): PiniaPlugin {
  return ({ store, options }) => {
    if (options.debounce) {
      return Object.keys(options.debounce).reduce(
        (debounced, action) => {
          debounced[action] = useDebounceFn(
            store[action],
            options.debounce[action]
          )
          return debounced
        },
        {} as Record<string, Function>
      )
    }
  }
}
```

```ts
defineStore('search', {
  actions: {
    search() {
      /* ... */
    }
  },
  debounce: {
    search: 300
  }
})
```

## Plugins en Nuxt

Con `@pinia/nuxt`, registrar plugins en un fichero de plugin de Nuxt:

```ts
// plugins/pinia-persist.ts
export default defineNuxtPlugin(({ $pinia }) => {
  if (import.meta.client) {
    $pinia.use(piniaLocalStorage())
  }
})
```

## Plugins de la comunidad más usados

| Plugin                        | Qué hace                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `pinia-plugin-persistedstate` | Persistir stores en localStorage/sessionStorage/cookies con control granular |
| `@pinia/colada`               | Gestión de estado asíncrono (data fetching, caché, invalidación)             |

## Plugin vs acción de store vs composable

| Necesidad                                                                            | Usar             |
| ------------------------------------------------------------------------------------ | ---------------- |
| Comportamiento añadido a TODOS los stores (logging, persistencia, estado compartido) | Plugin           |
| Lógica de negocio para un store específico                                           | Acción del store |
| Lógica reutilizable no ligada a un store                                             | Composable       |

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Qué es Pinia Colada?](/es/q/pinia-colada) · [¿Cuándo usar Pinia vs composable vs ref local?](/es/q/pinia-vs-composable-vs-local)

## Referencias

- [Plugins](https://pinia.vuejs.org/core-concepts/plugins.html) - Pinia docs
- [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) - Persisted state plugin docs
- [Defining Stores](https://pinia.vuejs.org/core-concepts/) - Pinia docs
