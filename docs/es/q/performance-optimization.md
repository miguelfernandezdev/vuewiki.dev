---
order: 24
title: "¿Cómo optimizarías el rendimiento de una app Vue?"
difficulty: "advanced"
tags: ["performance"]
---

La optimización de rendimiento no es una lista de trucos que se aplican de antemano — es un ciclo: **medir -> identificar el cuello de botella -> corregirlo -> medir de nuevo**. Usa Vue DevTools, la pestaña Performance del navegador y Lighthouse para encontrar dónde se va realmente el tiempo antes de cambiar cualquier código.

## Optimizaciones de renderizado

El sistema de reactividad de Vue es eficiente por diseño, pero no puede saber qué partes de tu árbol de componentes son verdaderamente dinámicas y cuáles no. Estas directivas y APIs le dan pistas al compilador y al runtime para omitir trabajo innecesario.

### `v-once` para contenido estático

`v-once` renderiza el elemento o componente exactamente una vez y lo elimina por completo del seguimiento de reactividad de Vue. El virtual DOM nunca volverá a hacer diff sobre él. Úsalo para contenido que es genuinamente estático durante toda la vida de la página: pies de página legales, textos de páginas informativas, sprites de iconos.

```vue
<template>
  <!-- Se renderiza una vez, nunca vuelve a ser diffeado -->
  <footer v-once>
    <p>© 2024 Acme Corp. Todos los derechos reservados.</p>
  </footer>
</template>
```

### `v-memo` para elementos de lista que rara vez cambian

`v-memo` acepta un array de dependencias, igual que `useMemo` funciona en React. Vue omite el re-render del subárbol cuando todos los valores de ese array son iguales al render anterior. Esto es especialmente útil dentro de bucles `v-for` donde solo una pequeña fracción de los elementos cambia en cada actualización.

```vue
<script setup lang="ts">
interface Item {
  id: number
  label: string
}

defineProps<{
  items: Item[]
  selectedId: number
}>()
</script>

<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.id"
      v-memo="[item.id === selectedId]"
    >
      {{ item.label }}
    </li>
  </ul>
</template>
```

Con 1.000 elementos en la lista, seleccionar una fila diferente hace que Vue solo re-renderice las dos filas cuyo valor de `v-memo` cambió — no las 1.000.

### `shallowRef` y `shallowReactive` para objetos grandes

Por defecto, `ref()` y `reactive()` hacen reactiva cada propiedad anidada. Para un objeto de configuración con cientos de claves, o una estructura de datos de solo lectura que recibes de una API y nunca mutas en profundidad, esto es un desperdicio — Vue recorre el objeto completo al inicializarlo para adjuntar el seguimiento. `shallowRef` y `shallowReactive` hacen reactivo solo el nivel superior, lo cual es suficiente cuando reemplazas el objeto entero en lugar de mutar propiedades anidadas.

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

interface Config {
  theme: string
  locale: string
  featureFlags: Record<string, boolean>
  // ... potencialmente cientos de claves más
}

const config = shallowRef<Config>({
  theme: 'dark',
  locale: 'en',
  featureFlags: {}
})

function updateConfig(next: Config) {
  // Reemplazar la ref de nivel superior dispara la reactividad correctamente
  config.value = next
}
</script>
```

### Caché de `computed` frente a llamar a un método repetidamente

Una propiedad `computed` tiene caché: Vue evalúa la función una vez y devuelve el resultado cacheado en cada acceso posterior hasta que alguna de sus dependencias reactivas cambia. Una llamada a un método no tiene caché — se ejecuta en cada render. Si tienes una operación costosa de filtrado u ordenación que no necesita ejecutarse en cada pulsación de tecla, hazla un `computed`, no un método.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const items = ref<string[]>(['banana', 'apple', 'cherry'])

// Se ejecuta una vez, con caché hasta que `items` cambie
const sortedItems = computed(() => [...items.value].sort())

// Se ejecuta en cada render — sin caché
function getSortedItems() {
  return [...items.value].sort()
}
</script>
```

## Optimizaciones de carga

El rendimiento de renderizado solo importa una vez que la app está en el navegador. Llegar ahí más rápido — enviando menos JavaScript en la ruta crítica — es donde suelen estar las mejoras más significativas.

### Code splitting a nivel de ruta

Cada ruta que no sea la ruta de entrada puede cargarse de forma diferida (lazy-loaded). Vite (y webpack) dividen estas rutas en chunks separados que solo se obtienen cuando el usuario navega a esa ruta. La sintaxis es un import dinámico que devuelve un componente.

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/dashboard',
      // Este chunk solo se obtiene cuando el usuario navega a /dashboard
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router
```

### `defineAsyncComponent` para componentes pesados

Puedes aplicar el mismo patrón de lazy loading a componentes individuales — no solo a rutas. Un editor de texto enriquecido, un visor de PDF o una librería de gráficas pueden añadir cientos de KB a tu bundle. `defineAsyncComponent` difiere la carga hasta que el componente se renderiza realmente.

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const RichTextEditor = defineAsyncComponent(() =>
  import('@/components/RichTextEditor.vue')
)

const ChartWidget = defineAsyncComponent({
  loader: () => import('@/components/ChartWidget.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,      // Mostrar el spinner solo después de 200ms
  timeout: 5000
})
</script>

<template>
  <RichTextEditor v-if="isEditing" />
  <ChartWidget />
</template>
```

### Lazy hydration en Nuxt

En Nuxt, prefijar un componente con `Lazy` difiere su JavaScript hasta que el componente entra en el viewport (o se necesita). El componente sigue siendo renderizado por el servidor como HTML, pero la hidratación del lado del cliente — que es lo que lo hace interactivo — se retrasa. Esto mejora directamente el Time to Interactive en páginas con mucho contenido.

```vue
<template>
  <!-- Se hidrata de inmediato -->
  <HeroSection />

  <!-- La hidratación se difiere hasta que el componente se necesite -->
  <LazyCommentSection />
  <LazyRecommendedArticles />
</template>
```

## Rendimiento en listas

Las listas largas son uno de los problemas de rendimiento más predecibles en aplicaciones frontend. Si renderizas 1.000 elementos `<li>` en el DOM, el navegador tiene que calcular el layout y pintar los 1.000 — incluso los que están fuera de pantalla. El virtual scrolling resuelve esto renderizando solo las filas visibles en el viewport en cada momento (típicamente 20–50 elementos), reciclando nodos del DOM a medida que el usuario hace scroll.

Para Vue, [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) y [@tanstack/virtual](https://tanstack.com/virtual/latest) son las dos opciones habituales. El principio es el mismo: pasas el array completo de datos, la librería calcula qué fragmento es visible, y solo esos elementos existen en el DOM.

```vue
<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

interface User {
  id: number
  name: string
  email: string
}

defineProps<{ users: User[] }>()
</script>

<template>
  <RecycleScroller
    :items="users"
    :item-size="56"
    key-field="id"
    v-slot="{ item }"
  >
    <UserRow :user="item" />
  </RecycleScroller>
</template>
```

La **estabilidad de props** es un patrón relacionado. Cuando pasas valores derivados a un elemento de lista que cambian en cada re-render del padre, todos los elementos se re-renderizan también — aunque sus propios datos no hayan cambiado. Prefiere pasar el booleano derivado directamente:

```vue
<!-- Inestable: el prop `activeId` hace que todos los elementos se re-rendericen -->
<UserRow
  v-for="user in users"
  :key="user.id"
  :user="user"
  :active-id="activeId"
/>

<!-- Estable: solo el elemento cuyo valor `active` cambia se re-renderiza -->
<UserRow
  v-for="user in users"
  :key="user.id"
  :user="user"
  :active="user.id === activeId"
/>
```

## Rendimiento de la reactividad

El sistema de reactividad de Vue tiene un coste proporcional al número de dependencias reactivas que creas y con qué frecuencia cambian. Algunas pautas:

**Prefiere `computed` frente a `watch`.** Un `watch` ejecuta efectos secundarios y es más difícil de optimizar para Vue. Un `computed` es un valor derivado puro que solo se recalcula cuando sus entradas cambian. La mayoría de las transformaciones de datos pertenecen a un `computed`.

**No hagas todo reactivo.** Los datos que solo lees y nunca mutas — tablas de búsqueda, mapas de enumeraciones, traducciones estáticas — no necesitan ser reactivos en absoluto. Declararlos como una `const` plana, o congélalos con `Object.freeze` para dejar clara esa intención y evitar la observación profunda accidental.

```ts
// Sin coste de reactividad — Vue no intentará observar esto
const STATUS_LABELS = Object.freeze({
  pending: 'Pendiente de revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado'
} as const)
```

**Evita watchers profundos sobre objetos grandes.** `watch(bigObject, handler, { deep: true })` recorre el objeto completo en cada cambio para detectar mutaciones. Si necesitas reaccionar a un campo anidado, vigila solo ese campo: `watch(() => bigObject.value.nestedField, handler)`.

## Herramientas de medición

Ningún esfuerzo de optimización está completo sin medición. Estas son las herramientas a las que debes acudir primero:

| Herramienta | Qué muestra |
| --- | --- |
| Pestaña Performance de Vue DevTools | Tiempos de render de componentes, número de re-renders |
| Pestaña Performance del navegador | Flame chart, tareas largas, cambios de layout |
| Lighthouse | Puntuaciones de Core Web Vitals |
| vite-bundle-visualizer | Composición y tamaños del bundle |
| Pestaña Network | Peticiones redundantes, payloads grandes |

La pestaña Performance de Vue DevTools es el punto de partida más útil para problemas en tiempo de ejecución — muestra qué componente se re-renderiza, con qué frecuencia y durante cuánto tiempo. La pestaña Performance del navegador va más a fondo en el hilo principal, mostrando la ejecución de JavaScript junto con el layout y la pintura. Lighthouse te da una puntuación de resumen y métricas CWV específicas (LCP, CLS, INP) que reflejan lo que experimentan los usuarios reales. `vite-bundle-visualizer` (`npx vite-bundle-visualizer`) visualiza tus chunks de salida como un treemap, lo que hace evidente cuando una sola dependencia está dominando tu bundle.

## Errores comunes

- **Optimizar antes de medir.** La optimización prematura no solo es un desperdicio — puede empeorar el código sin ninguna ganancia real.
- **Hacer todo reactivo.** Los datos estáticos, las constantes y los mapas de búsqueda no necesitan ir dentro de `ref` o `reactive`.
- **No hacer code splitting de las rutas.** Un grafo de imports síncronos para toda la app significa que el usuario descarga todo antes de que se renderice nada.
- **Watchers profundos sobre objetos grandes.** `{ deep: true }` sobre un objeto complejo recorre todas las claves en cada cambio — usa un getter dirigido en su lugar.
- **Ignorar la estabilidad de props en listas.** Pasar valores derivados inestables como props provoca que listas enteras se re-rendericen cuando solo un elemento cambió.

---

Ver también: [¿Cómo diagnosticarías una página lenta?](/es/q/diagnose-slow-page) · [¿Qué son v-once y v-memo?](/es/q/v-once-v-memo) · [¿Cómo virtualizarías una lista?](/es/q/list-virtualization) · [¿Cómo funcionan las optimizaciones de estabilidad de props?](/es/q/perf-props-stability)

## Referencias

- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Chrome docs
