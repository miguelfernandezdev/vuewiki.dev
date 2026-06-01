---
order: 39
title: "¿Por qué mi watchEffect pierde dependencias después de un await?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
---

Porque `watchEffect` solo rastrea dependencias durante la ejecución **síncrona**. Después del primer `await`, Vue deja de rastrear. Cualquier propiedad reactiva accedida después de ese punto es invisible para el watcher.

```ts
const userId = ref(1)
const includeDetails = ref(true)

watchEffect(async () => {
  const res = await fetch(`/api/users/${userId.value}`) // userId rastreado
  const data = await res.json()

  if (includeDetails.value) { // NO rastreado, después del await
    // ...
  }
})
```

Cambiar `userId` vuelve a ejecutar el efecto. Cambiar `includeDetails` no hace nada porque Vue nunca lo vio siendo accedido.

## Cómo solucionarlo

**Opción 1:** Lee todos los valores reactivos antes del primer `await`.

```ts
watchEffect(async () => {
  const id = userId.value             // rastreado
  const withDetails = includeDetails.value  // rastreado

  const res = await fetch(`/api/users/${id}`)
  const data = await res.json()

  if (withDetails) {
    // ...
  }
})
```

**Opción 2:** Usa `watch` con fuentes explícitas. Es la opción más segura para trabajo asíncrono porque las dependencias se declaran de antemano, no se detectan automáticamente.

```ts
watch(
  [userId, includeDetails],
  async ([id, withDetails]) => {
    const res = await fetch(`/api/users/${id}`)
    const data = await res.json()

    if (withDetails) {
      // ...
    }
  },
  { immediate: true }
)
```

## Por qué ocurre esto

El rastreo de dependencias de Vue funciona interceptando lecturas de propiedades (acceso a `.value`) durante la ejecución del getter. El `await` de JavaScript cede el control de vuelta al event loop. Vue deja de registrar después de ese yield porque no puede garantizar qué microtarea se ejecuta a continuación. Todo lo que ocurre antes del primer `await` es síncrono y se rastrea con normalidad.
