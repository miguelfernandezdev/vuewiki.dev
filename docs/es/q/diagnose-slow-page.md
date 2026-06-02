---
order: 141
title: "Una página tarda 3-4 segundos en ser interactiva. ¿Cómo la diagnosticas y corriges?"
difficulty: "advanced"
tags: ["performance", "debugging"]
---

Sigue un proceso estructurado: mide, identifica la categoría del cuello de botella, corrige, mide de nuevo. El cuello de botella siempre es una de tres cosas: la red (llamadas a la API lentas o demasiadas), el bundle (demasiado JavaScript enviado) o el renderizado (demasiado trabajo en el hilo principal). No vuelques soluciones a ciegas. Diagnostica primero, luego aplica soluciones específicas.

## Paso 1: Medir

Abre las DevTools del navegador y graba un trace de rendimiento de la carga de la página. Esto te da un flame chart que muestra exactamente dónde se invierte el tiempo.

Métricas clave a revisar:
- **Time to Interactive (TTI)**: cuándo la página responde a la entrada
- **Largest Contentful Paint (LCP)**: cuándo el contenido principal es visible
- **Total Blocking Time (TBT)**: cuánto tiempo estuvo bloqueado el hilo principal

También ejecuta una auditoría de Lighthouse (DevTools > pestaña Lighthouse) para obtener un resumen puntuado con recomendaciones específicas.

## Paso 2: Revisar la red

Abre la pestaña de Red y recarga. Busca:

**Llamadas a la API lentas**: un endpoint que tarda 2 segundos hace esperar a toda la página. Corrígelo en el backend (consultas de base de datos, caché, paginación) u obtén los datos en paralelo en lugar de secuencialmente.

```vue
<script setup>
// MAL: secuencial — tiempo total = A + B + C
const users = await fetch('/api/users').then(r => r.json())
const posts = await fetch('/api/posts').then(r => r.json())
const stats = await fetch('/api/stats').then(r => r.json())

// BIEN: paralelo — tiempo total = max(A, B, C)
const [users, posts, stats] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
  fetch('/api/stats').then(r => r.json())
])
</script>
```

**Demasiadas peticiones**: 20 llamadas a la API al cargar la página significa 20 viajes de ida y vuelta. Combínalas en menos endpoints o usa el patrón BFF (Backend for Frontend).

**Payloads grandes**: una API que devuelve 500 KB de JSON cuando la página solo necesita 10 campos. Añade paginación, selección de campos o comprime la respuesta.

## Paso 3: Revisar el tamaño del bundle

Ejecuta `npx vite-bundle-visualizer` para ver qué hay en tu bundle de JavaScript. Problemas comunes:

**Importar librerías completas cuando solo necesitas una función**:

```js
// MAL: importa todo lodash (~70 KB)
import _ from 'lodash'

// BIEN: importa solo debounce (~1 KB)
import debounce from 'lodash-es/debounce'
```

**No dividir el código por rutas**:

```ts
// MAL: todas las rutas en el bundle principal
import Dashboard from './views/Dashboard.vue'
import Settings from './views/Settings.vue'

// BIEN: cada ruta carga bajo demanda
const Dashboard = () => import('./views/Dashboard.vue')
const Settings = () => import('./views/Settings.vue')
```

**Componentes pesados cargados de forma anticipada**:

```vue
<script setup>
// MAL: la librería de gráficos carga aunque la pestaña no sea visible
import HeavyChart from './HeavyChart.vue'

// BIEN: carga solo cuando se renderiza
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
</script>
```

## Paso 4: Revisar problemas de reactividad de Vue

Abre Vue DevTools y observa la pestaña de rendimiento. Ordena los componentes por tiempo de render.

**Demasiados refs o muy profundos**: `reactive()` en un array de 10.000 elementos crea un Proxy para cada objeto anidado. Usa `shallowRef` cuando reemplazas los datos por completo.

```js
// MAL: Vue crea wrappers Proxy para cada elemento y propiedad anidada
const items = ref(hugeArrayFromApi)

// BIEN: solo el ref de nivel superior es reactivo
const items = shallowRef(hugeArrayFromApi)
```

**Watchers que provocan actualizaciones en cascada**: un `watch` que modifica el estado activa otro render, que activa otro watch.

```js
// MAL: el watch dispara un cambio de estado → re-render → el watch se activa de nuevo
watch(items, () => {
  filteredItems.value = items.value.filter(i => i.active)
})

// BIEN: computed está en caché, se ejecuta una vez por cambio de dependencia
const filteredItems = computed(() => items.value.filter(i => i.active))
```

**Métodos llamados en templates**: un método en una expresión de template se ejecuta en cada render. Un computed solo se ejecuta cuando cambian sus dependencias.

```vue
<!-- MAL: expensiveFilter() se ejecuta en cada render -->
<div v-for="item in expensiveFilter(items)" :key="item.id">

<!-- BIEN: se ejecuta solo cuando items cambia -->
<div v-for="item in filteredItems" :key="item.id">
```

## Paso 5: Revisar problemas de renderizado

**v-if vs v-show**: `v-if` destruye y recrea el DOM. Para algo que alterna con frecuencia (pestañas, tooltips), `v-show` solo alterna `display: none`.

**:key faltante en v-for**: sin una key estable, Vue no puede rastrear qué elementos cambiaron y re-renderiza toda la lista en lugar de parchear elementos individuales.

**Listas grandes sin virtualización**: 10.000 nodos DOM es costoso. Usa `@tanstack/vue-virtual` o `vue-virtual-scroller` para renderizar solo los elementos visibles.

```vue
<script setup>
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(items, {
  itemHeight: 50
})
</script>
```

**Componentes que se re-renderizan innecesariamente**: comprueba en Vue DevTools los componentes que se re-renderizan cuando no deberían. Causa habitual: props inestables (pasar una nueva referencia de objeto en cada render).

## Paso 6: Medir de nuevo

Después de cada corrección, vuelve a ejecutar el trace de rendimiento y la auditoría de Lighthouse. Compara TTI, LCP y TBT antes y después. Si los números no mejoraron, la corrección apuntó al cuello de botella equivocado. Vuelve al paso 2.

## Lista de diagnóstico

| Cuello de botella | Herramienta de identificación | Correcciones habituales |
|---|---|---|
| APIs lentas | Pestaña de red, gráfico de cascada | Peticiones en paralelo, caché, paginación |
| Demasiadas peticiones | Pestaña de red, contador de peticiones | Combinar endpoints, BFF |
| Bundle grande | vite-bundle-visualizer | Code splitting, rutas lazy, tree shaking |
| Reactividad profunda | Pestaña de rendimiento de Vue DevTools | shallowRef, evitar reactive profundo en datos grandes |
| Watchers en cascada | Timeline de Vue DevTools | Sustituir watch por computed |
| Listas grandes | Pestaña de elementos, conteo de nodos DOM | Virtual scrolling |
| Re-renders innecesarios | Resaltado de componentes en Vue DevTools | Props estables, v-once, v-memo |

## La estructura para la entrevista

Al responder esta pregunta en una entrevista, sigue el proceso en orden: mide, red, bundle, reactividad, renderizado, mide de nuevo. Recorrer un proceso de diagnóstico estructurado demuestra más madurez técnica que enumerar optimizaciones al azar.

Ver también: [¿Cómo optimizar el rendimiento en una app Vue?](/es/q/performance-optimization) · [¿Qué es v-once y v-memo?](/es/q/v-once-v-memo) · [¿Cómo virtualizar una lista?](/es/q/list-virtualization) · [¿Qué es el tree-shaking?](/es/q/tree-shaking-vue3)

## Referencias

- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Chrome docs
- [Web Vitals](https://web.dev/articles/vitals) - web.dev
