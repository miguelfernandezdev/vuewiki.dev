---
order: 145
title: "¿Qué problemas de hidratación SSR causa Suspense y cómo se evitan?"
difficulty: "advanced"
tags: ["ssr", "components", "vueuse", "suspense"]
---

`<Suspense>` y SSR tienen casos límite conocidos. El problema central: durante la hidratación, el chunk de un componente asíncrono puede no estar cargado todavía, así que el cliente renderiza el fallback mientras el servidor envió el contenido resuelto. Esto crea un error de hidratación que provoca parpadeos, pérdida de estado o errores en tiempo de ejecución.

## Cómo ocurre el problema

```
1. El servidor resuelve el componente asíncrono, renderiza su HTML completo
2. El navegador muestra ese HTML inmediatamente
3. JavaScript carga, Vue comienza la hidratación
4. El chunk del componente asíncrono aún no ha cargado
5. Vue ve Suspense con un hijo no resuelto, muestra el fallback
6. El HTML completo parpadea a un esqueleto "Cargando..."
7. El chunk carga, el componente se renderiza de nuevo
```

El usuario ve el contenido, luego un destello del estado de carga, y luego el contenido de nuevo.

## Código problemático

```vue
<script setup>
const AsyncDashboard = defineAsyncComponent(
  () => import('./Dashboard.vue')
)
</script>

<template>
  <Suspense>
    <AsyncDashboard />
    <template #fallback>Cargando...</template>
  </Suspense>
</template>
```

Esto funciona en CSR pero provoca parpadeo de hidratación en SSR porque el chunk puede no estar listo cuando comienza la hidratación.

## Solución 1: usar async setup en lugar de defineAsyncComponent

Los componentes con `await` en `<script setup>` son inherentemente asíncronos y funcionan mejor con Suspense en SSR porque Nuxt precarga sus datos durante el renderizado en el servidor:

```vue
<!-- Dashboard.vue -->
<script setup>
const { data } = await useFetch('/api/dashboard')
</script>

<template>
  <div>{{ data }}</div>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <Suspense>
    <Dashboard />
    <template #fallback><DashboardSkeleton /></template>
  </Suspense>
</template>
```

Los datos se serializan en el payload, así que la hidratación tiene todo lo que necesita sin esperar a un chunk separado.

## Solución 2: envolver con ClientOnly

Para componentes donde el SSR no es crítico, omite el renderizado en el servidor:

```vue
<template>
  <ClientOnly>
    <Suspense>
      <AsyncDashboard />
      <template #fallback>Cargando panel...</template>
    </Suspense>
    <template #fallback>
      <DashboardSkeleton />
    </template>
  </ClientOnly>
</template>
```

El servidor renderiza el esqueleto. El cliente carga y resuelve el componente asíncrono. No hay error de hidratación porque el servidor nunca renderizó el contenido real.

## Solución 3: Suspense separado por componente

En lugar de un Suspense que envuelva todo, dale a cada sección asíncrona su propio límite:

```vue
<template>
  <div class="dashboard">
    <Suspense>
      <AsyncHeader />
      <template #fallback><HeaderSkeleton /></template>
    </Suspense>

    <Suspense>
      <AsyncStats />
      <template #fallback><StatsSkeleton /></template>
    </Suspense>

    <Suspense>
      <AsyncTable />
      <template #fallback><TableSkeleton /></template>
    </Suspense>
  </div>
</template>
```

Cada sección se resuelve de forma independiente. Un chunk lento solo afecta a su propio límite Suspense, no a toda la página.

## Solución 4: evitar useQuery después de await

Con librerías de obtención de datos como TanStack Query, todas las llamadas a `useQuery` deben ir ANTES de cualquier `await`. El contexto de composición de Vue se pierde tras un `await`, y las queries configuradas después no se integrarán correctamente con Suspense:

```vue
<script setup>
// Todas las queries ANTES del await
const { data, suspense } = useQuery({
  queryKey: ['dashboard'],
  queryFn: fetchDashboard,
  staleTime: 5 * 60 * 1000
})

// El await DESPUÉS de configurar todas las queries
await suspense()
</script>
```

Configurar un `staleTime` adecuado evita que el cliente vuelva a pedir datos que ya se obtuvieron en el servidor.

## Referencia de problemas habituales

| Síntoma | Causa | Solución |
|---|---|---|
| El contenido parpadea a cargando y vuelve | El chunk asíncrono no está listo al hidratar | Usa async setup o ClientOnly |
| Destello en blanco en Safari | Carga más lenta del chunk en Safari | Precarga los chunks críticos, usa esqueletos |
| Aviso "Hydration mismatch" | El servidor y el cliente renderizan contenido diferente | Haz coincidir la estructura del fallback con la salida del servidor |
| Los datos se piden dos veces | staleTime no configurado, el cliente vuelve a pedir | Configura staleTime en las queries |
| "Cannot access composable" tras await | useQuery llamado después de await | Mueve todas las llamadas a composables antes del await |

Ver también: [¿Cómo funciona Suspense?](/es/q/suspense) · [¿Qué son los componentes asíncronos?](/es/q/async-components)

## Referencias

- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
- [SSR](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Client Hydration](https://vuejs.org/guide/scaling-up/ssr.html#client-hydration) - Vue.js docs
