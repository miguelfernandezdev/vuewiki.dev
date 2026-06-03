---
order: 57
title: "¿Se puede usar await directamente en script setup? ¿Cuándo?"
difficulty: "intermediate"
tags: ["composition-api", "nuxt", "vueuse", "watchers", "suspense"]
summary: "Sí — el compilador lo envuelve en async setup(). La trampa: el padre debe proveer un <Suspense>. Nuxt lo hace automáticamente."
---

Sí, puedes usar `await` en el nivel superior de [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html). El compilador envuelve el bloque setup en una función `async setup()` automáticamente. El problema: los componentes asíncronos requieren un límite `<Suspense>` en el padre para gestionar el estado pendiente mientras el await se resuelve. Sin un límite `<Suspense>` en un componente padre, el componente asíncrono podría no renderizarse como se espera. Nuxt envuelve cada página en `<Suspense>` por defecto, así que en Nuxt puedes usar `await` libremente en páginas y layouts sin preocuparte por ello.

## Ejemplo básico

```vue
<!-- UserProfile.vue -->
<script setup>
const response = await fetch('/api/user/1')
const user = await response.json()
</script>

<template>
  <h1>{{ user.name }}</h1>
</template>
```

Esto compila a:

```js
export default {
  async setup() {
    const response = await fetch('/api/user/1')
    const user = await response.json()
    return { user }
  }
}
```

El componente es ahora un componente asíncrono. Vue suspende el renderizado hasta que setup se resuelve.

## El requisito de Suspense

Un componente asíncrono debe tener un ancestro `<Suspense>`. Sin él, el componente queda en estado pendiente indefinidamente:

```vue
<!-- Parent.vue -->
<template>
  <!-- MAL: sin Suspense → UserProfile nunca aparece -->
  <UserProfile />

  <!-- BIEN: Suspense gestiona el estado pendiente -->
  <Suspense>
    <UserProfile />
    <template #fallback>
      <p>Loading profile...</p>
    </template>
  </Suspense>
</template>
```

El slot `#fallback` se renderiza mientras el setup asíncrono está pendiente. Una vez que el await se resuelve, Vue intercambia el contenido real.

## En Nuxt: funciona sin configuración adicional

Nuxt envuelve cada componente de página en `<Suspense>` automáticamente a través de `<NuxtPage>`. No necesitas añadir `<Suspense>` tú mismo:

```vue
<!-- pages/users/[id].vue — página Nuxt -->
<script setup>
const route = useRoute()
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
</script>

<template>
  <h1>{{ user.name }}</h1>
</template>
```

Esto funciona sin configuración adicional porque el `app.vue` de Nuxt contiene `<NuxtPage>`, que internamente proporciona el límite `<Suspense>`. Durante SSR, el await se resuelve en el servidor. Durante la navegación del cliente, Nuxt muestra un indicador de carga mientras el setup de la nueva página se resuelve.

## Watchers y lifecycle hooks después de await

Cuando usas `await`, cualquier código después de él se ejecuta en una microtarea diferente. El compilador de `<script setup>` de Vue gestiona esto mediante `withAsyncContext`, que preserva la instancia del componente a través de los límites de await. Esto significa que `watch()` y los lifecycle hooks registrados después de un `await` SÍ funcionan correctamente.

Sin embargo, [`getCurrentInstance()`](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) es una API interna que puede no ser fiable después de `await`, por lo que el código que dependa directamente de ella podría comportarse de forma inesperada.

```vue
<script setup>
// Estos funcionan: registrados antes de cualquier await
const count = ref(0)
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))

const data = await fetch('/api/data').then(r => r.json())

// Estos también funcionan: withAsyncContext preserva la instancia
watch(data, (val) => console.log(val))       // funciona
onMounted(() => console.log('after await'))   // funciona
</script>
```

La recomendación: registrar los watchers, lifecycle hooks y composables ANTES del primer `await` sigue siendo buena práctica por legibilidad y claridad. Pon las declaraciones reactivas al principio, las operaciones asíncronas al final.

```vue
<script setup>
// 1. Todo el estado reactivo y composables primero
const count = ref(0)
const items = ref([])
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))

// 2. Operaciones asíncronas al final
const response = await fetch('/api/data')
items.value = await response.json()
</script>
```

## Cuándo usar await frente a useFetch

En Nuxt, prefiere `useFetch` sobre `await fetch()` directo:

```vue
<script setup>
// Preferible: gestiona payload SSR, caché y cancelación
const { data } = await useFetch('/api/users')

// Evitar: sin transferencia de payload, doble fetch en la hydration
const data = ref(await fetch('/api/users').then(r => r.json()))
</script>
```

Ambos usan `await`, pero `useFetch` se integra con el sistema de payload de Nuxt. El `fetch` directo se ejecuta de nuevo en el cliente durante la hydration.

## Cuándo NO usar await en setup

**Datos que cargan después de una interacción del usuario:** usa `$fetch` en manejadores de eventos o `useFetch` con `immediate: false`.

**Datos de varias fuentes independientes:** las cargas paralelas son mejores que los awaits secuenciales.

```vue
<script setup>
// MAL: secuencial — tiempo total = A + B
const users = await useFetch('/api/users')
const posts = await useFetch('/api/posts')

// BIEN: paralelo — tiempo total = max(A, B)
const [{ data: users }, { data: posts }] = await Promise.all([
  useFetch('/api/users'),
  useFetch('/api/posts')
])
</script>
```

## Resumen

| Contexto | ¿Funciona await en setup? | ¿Se necesita Suspense? |
|---|---|---|
| Página/layout Nuxt | Sí | No (automático) |
| Componente Nuxt dentro de una página | Sí | Sí (añade Suspense en el padre) |
| Vue sin Nuxt | Sí | Sí (debes añadirlo tú) |
| Dentro de un manejador de eventos | No aplica (usa $fetch) | No |

Ver también: [¿Cuáles son los lifecycle hooks en Vue 3?](/es/q/lifecycle-hooks) · [¿Qué es script setup?](/es/q/script-setup)

## Referencias

- [\<script setup\>](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
- [getCurrentInstance](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) - Vue.js docs
