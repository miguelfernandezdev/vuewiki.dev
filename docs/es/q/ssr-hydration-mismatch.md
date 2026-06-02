---
order: 144
title: "¿Qué causa los errores de hidratación en SSR y cómo se corrigen?"
difficulty: "advanced"
tags: ["ssr", "errors", "vite"]
---

Un error de hidratación ocurre cuando el HTML que renderiza el cliente difiere del que envió el servidor. Vue intenta recuperarse descartando los nodos que no coinciden y re-renderizándolos, lo que provoca parpadeos, pérdida de rendimiento y manejadores de eventos rotos.

## Causas habituales

**1. HTML anidado no válido.** Los navegadores corrigen automáticamente el marcado inválido antes de que Vue lo vea.

```vue
<template>
  <!-- El navegador lo divide en <p></p><div>...</div><p></p> -->
  <p>
    <div>Esto rompe la hidratación</div>
  </p>
</template>
```

**2. Valores no deterministas en el render.** `Math.random()`, `Date.now()` y `new Date().toLocaleString()` producen resultados distintos en el servidor y en el cliente.

```vue
<template>
  <!-- Servidor: "field-0.847..." / Cliente: "field-0.231..." -->
  <input :id="'field-' + Math.random()" />

  <!-- La zona horaria del servidor != zona horaria del cliente -->
  <span>{{ new Date().toLocaleTimeString() }}</span>
</template>
```

Solución: aplaza los valores no deterministas a `onMounted`.

```ts
const fieldId = ref('field-default')
const displayTime = ref('')

onMounted(() => {
  fieldId.value = 'field-' + crypto.randomUUID()
  displayTime.value = new Date().toLocaleTimeString()
})
```

**3. Extensiones del navegador que inyectan contenido.** Extensiones como bloqueadores de anuncios o gestores de contraseñas modifican el DOM entre la llegada del HTML del servidor y el inicio de la hidratación de Vue.

## Suprimir discrepancias intencionadas (Vue 3.5+)

Usa `data-allow-mismatch` cuando la diferencia es esperada:

```vue
<template>
  <span data-allow-mismatch="text">
    {{ clientOnlyTimestamp }}
  </span>
</template>
```

Valores aceptados: `text`, `children`, `class`, `style`, `attribute`, o sin valor (suprime todos).

## Depuración

Activa los avisos detallados en `vite.config.ts`:

```ts
export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true
  }
})
```

| Mensaje de error | Causa probable |
|---|---|
| "Hydration text content mismatch" | Fechas, valores aleatorios, diferencias de zona horaria |
| "Hydration children mismatch" | HTML anidado inválido, renderizado condicional |
| "Hydration node mismatch" | Se renderiza un elemento completamente distinto |

Ver también: [¿Qué es la hydration?](/es/q/what-is-hydration) · [¿Qué es SSR?](/es/q/what-is-ssr) · [¿Cómo evitar problemas con APIs específicas de plataforma en SSR?](/es/q/ssr-platform-specific-apis)

## Referencias

- [SSR Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration) - Vue.js docs
- [Client-Only Components](https://nuxt.com/docs/api/components/client-only) - Nuxt docs
- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
