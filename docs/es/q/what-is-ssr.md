---
order: 141
title: "¿Qué es el Server Side Rendering y cuáles son sus ventajas?"
difficulty: "intermediate"
tags: ["ssr"]
summary: "El servidor ejecuta componentes Vue y envía HTML completo. El navegador muestra contenido inmediatamente, luego JavaScript carga y hydrata para interactividad."
---

Server Side Rendering (SSR) significa generar el HTML de una página en el servidor en lugar de en el navegador. Cuando un usuario solicita una página, el servidor ejecuta tus componentes Vue, produce HTML completo y lo envía. El navegador muestra el contenido de inmediato; luego carga JavaScript y hace la página interactiva (hidratación).

## Cómo funciona el SSR en Vue

```
1. El navegador solicita /about
2. El servidor crea una instancia de la app Vue
3. El servidor ejecuta los componentes y resuelve los datos asíncronos
4. El servidor renderiza el árbol de componentes a una cadena HTML
5. El servidor envía el HTML más el estado serializado al navegador
6. El navegador muestra el HTML al instante (contenido visible)
7. Se carga el bundle de JavaScript
8. Vue "hidrata" el HTML estático: adjunta event listeners y lo hace interactivo
```

## SSR vs CSR (Client Side Rendering)

Con CSR (el enfoque SPA por defecto), el servidor envía una carcasa HTML vacía y el navegador construye toda la página con JavaScript:

```
CSR:
  El servidor envía → <div id="app"></div> + bundle JS
  El navegador descarga JS → lo ejecuta → renderiza el contenido
  El usuario ve una página en blanco hasta que termina el JS

SSR:
  El servidor envía → HTML completo con contenido + bundle JS
  El navegador muestra el HTML inmediatamente
  El JS carga en segundo plano → hidrata → la página se vuelve interactiva
```

## Ventajas del SSR

**Primera pintura con contenido más rápida.** Los usuarios ven el contenido antes de que cargue JavaScript. En conexiones lentas o dispositivos de gama baja, esta diferencia es significativa.

**Mejor SEO.** Los crawlers de los motores de búsqueda reciben HTML completo. Aunque Google puede ejecutar JavaScript, otros crawlers a menudo no pueden, y Google también indexa el contenido pre-renderizado más rápido.

**Mejor compartición en redes sociales.** Cuando alguien comparte un enlace en Twitter, Slack o Discord, la tarjeta de vista previa se genera a partir de la respuesta HTML. Las páginas CSR muestran previsualizaciones en blanco a menos que añadas un manejo separado de las etiquetas meta.

**Funciona sin JavaScript.** El contenido inicial es visible aunque JavaScript no cargue o esté desactivado. Los formularios y los enlaces pueden seguir funcionando mediante el comportamiento HTML estándar.

## Desventajas del SSR

**Coste del servidor.** Cada solicitud ejecuta Vue en el servidor. Una app CSR sirve archivos estáticos desde una CDN. El SSR necesita recursos de cómputo que escalan con el tráfico.

**Restricciones de desarrollo.** El código se ejecuta en dos entornos. No puedes usar `window`, `document` ni APIs solo del navegador en código que se ejecuta en el servidor. Los lifecycle hooks como `onMounted` solo se ejecutan en el cliente.

**Mayor Time to Interactive.** La página es visible antes, pero no es interactiva hasta que se completa la hidratación. Los usuarios podrían hacer clic en un botón que aún no responde.

**Mayor complejidad.** La gestión de estado debe ser segura para SSR (sin singletons). Algunas librerías de terceros pueden no admitir SSR. La depuración abarca dos entornos.

## SSR en Vue sin framework

Vue proporciona `@vue/server-renderer` para SSR manual:

```ts
// server.js
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'

async function render(url) {
  const app = createSSRApp(App)
  const html = await renderToString(app)
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `
}
```

```ts
// client.js
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)
app.mount('#app') // hidrata el HTML existente en lugar de reemplazarlo
```

Observa `createSSRApp` en lugar de `createApp`. Esto le dice a Vue que hidrate el marcado existente en lugar de crear nuevo DOM.

## SSR con Nuxt (el enfoque práctico)

Nuxt gestiona toda la fontanería del SSR por ti: render en el servidor, hidratación, serialización del estado, división de código y guardias de API específicas de la plataforma:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true // este es el valor por defecto
})
```

Sin configuración manual del servidor, sin archivos de entrada separados, sin código de serialización del estado. Por eso la mayoría de las apps Vue con SSR usan Nuxt.

## Cuándo usar SSR

| Caso de uso | ¿SSR? |
|---|---|
| Sitio de marketing, blog, documentación | Sí, o prerenderizar (SSG) |
| Páginas de productos de comercio electrónico | Sí (SEO + rendimiento) |
| Panel de control detrás de login | No (CSR es más simple, sin SEO necesario) |
| App colaborativa en tiempo real | Quizás (SSR para la carga inicial, luego CSR) |
| Sitio estático sin datos dinámicos | SSG (prerenderizar en tiempo de compilación) |

Ver también: [¿Qué es la hidratación?](/es/q/what-is-hydration) · [¿Cómo se resuelven los desajustes de hidratación?](/es/q/ssr-hydration-mismatch) · [¿Cuáles son los modos de renderizado en Nuxt?](/es/q/nuxt-rendering-modes)

## Referencias

- [Server-Side Rendering](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering) - Nuxt docs
- [Vue Server Renderer](https://vuejs.org/api/ssr.html) - Vue.js docs
