---
order: 114
title: "¿Qué es la hidratación y cómo funciona en Vue?"
difficulty: "intermediate"
tags: ["ssr"]
---

La hidratación es el proceso por el que Vue toma el HTML estático renderizado en el servidor y lo hace interactivo. El servidor envía HTML completamente renderizado para que el usuario vea el contenido de inmediato. Luego Vue carga en el cliente, recorre el DOM existente, adjunta los event listeners y conecta la reactividad. La página se convierte en una aplicación Vue en funcionamiento sin volver a renderizar desde cero.

## Cómo funciona la hidratación paso a paso

```
1. El servidor renderiza los componentes Vue a una cadena HTML
2. El servidor serializa el estado de la app en el HTML (normalmente como una etiqueta <script> con JSON)
3. El navegador recibe el HTML y lo muestra al instante (primera pintura rápida)
4. El navegador descarga el bundle de JavaScript
5. Vue crea una instancia de app del lado del cliente con createSSRApp
6. Vue recorre los nodos DOM existentes y los empareja con el Virtual DOM
7. Vue adjunta event listeners a los elementos existentes
8. Vue restaura el estado reactivo desde los datos serializados
9. La página es ahora completamente interactiva
```

La diferencia clave respecto a un montaje de SPA normal: Vue NO crea nuevos elementos DOM. Reutiliza lo que el servidor ya renderizó.

## createSSRApp vs createApp

```ts
// Entrada del cliente para SSR: hidrata el marcado existente
import { createSSRApp } from 'vue'
const app = createSSRApp(App)
app.mount('#app')

// SPA normal: reemplaza #app con nuevo DOM
import { createApp } from 'vue'
const app = createApp(App)
app.mount('#app')
```

`createSSRApp` le dice a Vue "ya hay HTML en el DOM, emparéjalo y conéctate a él". `createApp` le dice a Vue "vacía este elemento y renderiza desde cero".

## Desajustes de hidratación

Un desajuste ocurre cuando el HTML que el cliente renderizaría difiere del que envió el servidor. Vue muestra una advertencia e intenta recuperarse descartando el HTML del servidor y re-renderizando esa parte, lo que causa parpadeos y pérdida de rendimiento.

### Causas comunes

**HTML corregido por el navegador.** Los navegadores corrigen el anidamiento inválido automáticamente, creando un DOM diferente al que espera Vue:

```vue
<!-- El servidor envía esto -->
<p><div>Content</div></p>

<!-- El navegador lo corrige a esto -->
<p></p><div>Content</div><p></p>

<!-- Vue espera el original: desajuste -->
```

**Valores distintos en el servidor y en el cliente.** `Date.now()`, `Math.random()` o el formateo dependiente de la configuración regional producen salidas diferentes:

```vue
<template>
  <!-- Servidor: "6/1/2026" — Cliente: "01/06/2026" (configuración regional diferente) -->
  <span>{{ new Date().toLocaleDateString() }}</span>
</template>
```

**APIs solo del navegador usadas durante SSR.** Acceder a `window.innerWidth` en el servidor devuelve `undefined`, pero devuelve un número en el cliente.

### Cómo corregir los desajustes

**Mueve los valores dependientes del navegador a onMounted:**

```vue
<script setup>
const now = ref('')

onMounted(() => {
  now.value = new Date().toLocaleString()
})
</script>

<template>
  <span>{{ now }}</span>
</template>
```

**Usa ClientOnly (Nuxt) para componentes solo del navegador:**

```vue
<template>
  <ClientOnly>
    <BrowserOnlyChart />
    <template #fallback>
      <p>Loading chart...</p>
    </template>
  </ClientOnly>
</template>
```

**Permite desajustes intencionales (Vue 3.5+):**

```vue
<template>
  <span data-allow-mismatch>{{ new Date().toLocaleString() }}</span>
</template>
```

Esto suprime la advertencia para casos en los que sabes que el desajuste es inofensivo.

## Serialización del estado

Durante el SSR, el servidor serializa el estado de la app en el HTML para que el cliente pueda restaurarlo sin volver a hacer peticiones:

```html
<!-- El servidor inyecta esto -->
<script>
  window.__PINIA_STATE__ = {"user":{"id":1,"name":"Alice"}}
</script>
```

El cliente lee estos datos durante la hidratación e inicializa los stores con ellos. Por eso `useFetch` en Nuxt no vuelve a hacer la petición en el cliente: los datos ya están en el payload serializado.

## Línea de tiempo de la hidratación

| Fase | Lo que ve el usuario | ¿Interactivo? |
|---|---|---|
| Llega el HTML | Contenido completo | No (HTML estático) |
| Carga el CSS | Contenido con estilos | No |
| Descarga el JS | Contenido con estilos | No |
| Vue hidrata | El mismo contenido | Sí |

El intervalo entre "contenido visible" y "completamente interactivo" se llama Time to Interactive (TTI). Reducir el tamaño del bundle de JS y usar estrategias de hidratación diferida acortan este intervalo.

## Hidratación diferida (Nuxt)

Nuxt permite diferir la hidratación de componentes específicos para reducir el TTI:

```vue
<template>
  <LazyComments hydrate-on-visible />
  <LazyAnalytics hydrate-on-idle />
  <LazyDropdown hydrate-on-interaction />
  <LazyStaticFooter hydrate-never />
</template>
```

El HTML del componente es visible desde el SSR, pero Vue solo lo hidrata (adjunta el JS) cuando se activa el trigger. Los componentes por debajo del pliegue o no críticos pueden hidratarse más tarde sin bloquear la página principal.
