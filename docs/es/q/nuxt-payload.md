---
order: 143
title: "¿Qué es el payload de Nuxt y cómo evita la doble petición?"
difficulty: "intermediate"
tags: ["nuxt", "ssr"]
---

El payload es el mecanismo de Nuxt para transferir datos del servidor al cliente durante SSR. Cuando `useFetch`, `useAsyncData` o `useState` se resuelven en el servidor, Nuxt serializa sus resultados en una etiqueta `<script>` incrustada en la respuesta HTML. En el cliente, Nuxt lee esos datos serializados en lugar de volver a ejecutar las llamadas de fetch. Por eso no hay "doble petición": el servidor hace la petición una vez y el cliente reutiliza el resultado.

## Cómo funciona

Durante SSR, la secuencia es la siguiente:

1. El servidor ejecuta `<script setup>`, que llama a `useFetch('/api/users')`
2. El servidor espera a que la petición se resuelva y renderiza el HTML con los datos
3. Nuxt serializa los datos obtenidos en una etiqueta `<script>` dentro del HTML
4. El navegador recibe el HTML (ya renderizado) y el payload incrustado
5. En la hydration, `useFetch` lee el payload en lugar de volver a llamar a `/api/users`
6. La app queda interactiva sin ninguna petición de red adicional

## Qué hay en el HTML

Tras SSR, el HTML contiene algo así:

```html
<div id="__nuxt">
  <!-- HTML renderizado en el servidor con los datos ya visibles -->
  <ul>
    <li>Alice</li>
    <li>Bob</li>
  </ul>
</div>

<!-- El payload: datos serializados de las peticiones en el servidor -->
<script type="application/json" id="__NUXT_DATA__">
  [["users", [{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]]]
</script>
```

El payload contiene cada dato resuelto durante SSR: resultados de `useFetch`, resultados de `useAsyncData`, valores de `useState` y el estado de los stores de Pinia.

## Sin payload (el problema de la doble petición)

Si Nuxt no serializara los datos, el cliente tendría que volver a obtenerlos:

```
Servidor: fetch /api/users → renderiza HTML → envía al navegador       (petición #1)
Cliente: hydration → useFetch se ejecuta de nuevo → fetch /api/users   (petición #2)
```

El usuario ve el contenido renderizado, que desaparece brevemente mientras el cliente vuelve a hacer la petición y luego reaparece. Esto provoca un destello de contenido vacío y duplica la carga en la API.

Con el payload, el cliente omite la petición #2 por completo.

## Qué se incluye en el payload

```vue
<script setup>
// Todo esto se serializa en el payload durante SSR:

// 1. Resultados de useFetch
const { data: users } = await useFetch('/api/users')

// 2. Resultados de useAsyncData
const { data: stats } = await useAsyncData('stats', () => {
  return $fetch('/api/stats')
})

// 3. Valores de useState
const count = useState('counter', () => 0)
</script>
```

Los stores de Pinia usados durante SSR también se serializan. El cliente hace la hydration de los stores desde el payload sin volver a ejecutar la lógica de inicialización.

## $fetch NO usa el payload

```vue
<script setup>
// Esto NO se deduplica: se ejecuta tanto en el servidor como en el cliente
const users = ref(await $fetch('/api/users'))
</script>
```

El `$fetch` en bruto dentro de `<script setup>` se ejecuta durante SSR y luego vuelve a ejecutarse durante la hydration del cliente. No tiene integración con el payload. Usa siempre `useFetch` o `useAsyncData` para los datos que deben transferirse del servidor al cliente.

## Reducers y revivers del payload

Nuxt serializa el payload como JSON, lo que significa que algunos tipos no sobreviven por defecto (`Date`, `Map`, `Set`, clases personalizadas). Nuxt ofrece hooks para gestionar la serialización personalizada:

```ts
// plugins/payload.ts
export default defineNuxtPlugin(() => {
  definePayloadReducer('Date', (value) => {
    return value instanceof Date ? value.toISOString() : undefined
  })

  definePayloadReviver('Date', (value) => {
    return new Date(value)
  })
})
```

El reducer se ejecuta en el servidor (serializa) y el reviver se ejecuta en el cliente (deserializa). Sin esto, un objeto `Date` llegaría como una cadena de texto simple.

## Inspeccionar el payload

En desarrollo, puedes ver el payload en dos lugares:

1. **Ver fuente**: busca `__NUXT_DATA__` en la respuesta HTML
2. **Nuxt DevTools**: la pestaña Payload muestra todos los datos serializados con sus claves y valores

En producción, el payload está comprimido. Puedes revisar la pestaña Network para ver el tamaño del HTML inicial y cuántos datos se están transfiriendo.

## Consideraciones sobre el tamaño del payload

Los payloads grandes ralentizan la carga inicial de la página porque el navegador tiene que parsear un blob JSON grande antes de que comience la hydration:

```vue
<script setup>
// MAL: serializa 10.000 elementos en el payload HTML
const { data: allProducts } = await useFetch('/api/products')

// BIEN: paginado, solo serializa lo que necesita la primera página
const { data: products } = await useFetch('/api/products', {
  query: { page: 1, limit: 20 }
})
</script>
```

Si obtienes un conjunto de datos enorme durante SSR, todo ese conjunto acaba en el HTML. Pagina en el servidor para mantener el payload pequeño.

## Resumen

| Concepto | Comportamiento |
|---|---|
| `useFetch` / `useAsyncData` | El servidor hace la petición, el resultado se serializa en el payload, el cliente lo reutiliza |
| `useState` | El servidor establece el valor, se serializa en el payload, el cliente hace la hydration |
| Stores de Pinia | El estado del servidor se serializa, el cliente hace la hydration |
| `$fetch` en bruto en setup | Se ejecuta tanto en el servidor como en el cliente (doble petición) |
| `$fetch` en event handlers | Solo en el cliente, sin intervención de SSR |
