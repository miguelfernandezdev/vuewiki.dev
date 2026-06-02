---
order: 166
title: "¿Qué es getCurrentInstance() y por qué deberías evitarlo?"
difficulty: "advanced"
tags: ["composition-api"]
---

[`getCurrentInstance()`](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) devuelve la instancia interna del componente durante `setup()`. Expone internos como `$el`, `$parent`, `$refs`, `$emit`, el proxy del componente y todo el estado interno. Es una vía de escape para autores de librerías, no para código de aplicación. El equipo de Vue la marca explícitamente como API interna, lo que significa que puede cambiar entre versiones menores sin previo aviso. Si la usas en tu app, estás acoplándote a detalles de implementación que pueden romperse en cualquier actualización de Vue.

## Qué devuelve

```ts
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()

// instance.proxy — la interfaz pública (como `this` en Options API)
// instance.type — las opciones/definición del componente
// instance.parent — instancia del componente padre
// instance.appContext — contexto a nivel de app (plugins, directivas, provides)
// instance.emit — la función emit
// instance.props — props actuales
```

Solo funciona dentro de `setup()` o lifecycle hooks. Llamarla en un `setTimeout`, `Promise.then` o cualquier callback asíncrono después de que `setup` termine devuelve `null`:

```ts
onMounted(() => {
  const instance = getCurrentInstance() // funciona

  setTimeout(() => {
    const instance = getCurrentInstance() // null
  }, 1000)
})
```

## Por qué la gente recurre a ella

La mayoría de los usos caen en tres categorías, todas con alternativas correctas:

### 1. Acceder al elemento DOM del componente

```ts
// MAL: usando getCurrentInstance
const instance = getCurrentInstance()
const el = instance?.proxy?.$el

// BIEN: template ref
const elementRef = ref<HTMLElement>()
onMounted(() => {
  elementRef.value // el elemento DOM
})
```

### 2. Acceder al contexto a nivel de app (router, i18n, plugins personalizados)

```ts
// MAL: excavando por appContext
const instance = getCurrentInstance()
const router = instance?.appContext.config.globalProperties.$router

// BIEN: usa el composable que proporciona la librería
const router = useRouter()
const i18n = useI18n()
```

### 3. Acceder a instancias padre/hijo

```ts
// MAL: recorriendo el árbol de componentes
const instance = getCurrentInstance()
const parentData = instance?.parent?.proxy?.someData

// BIEN: props, emit, provide/inject
const someData = inject<string>('someData')
```

## Cuándo los autores de librerías la usan de forma legítima

Librerías como VueUse, Vue Router y Pinia usan `getCurrentInstance` internamente porque necesitan:

- Engancharse al lifecycle del componente desde fuera de `<script setup>`
- Acceder al contexto de la app para registrar plugins
- Leer el árbol de componentes para la integración con devtools

Por ejemplo, `useRouter()` llama internamente a `getCurrentInstance()` para acceder a la instancia del router instalada mediante `app.use(router)`. Pero la librería envuelve esto en una API pública estable, de modo que tu código nunca toca la instancia directamente.

## Los riesgos

1. **Sin seguridad de tipos**: el tipo de instancia interna no forma parte de la API pública de TypeScript de Vue. Tendrás que hacer casting a `any` en todas partes.

2. **Se rompe con actualizaciones**: la estructura interna de componentes de Vue ha cambiado entre 3.0, 3.2, 3.3 y 3.4. El código que accedía a `instance.setupState` o `instance.ctx` se ha roto entre versiones.

3. **No funciona en contextos asíncronos**: si tu composable hace algo asíncrono, `getCurrentInstance()` devuelve `null` tras el primer `await`, lo que genera bugs intermitentes.

4. **Diferencias en SSR**: la estructura de instancia difiere entre el render en cliente y servidor, por lo que código que funciona en el navegador puede fallar durante SSR.

## Resumen

| Necesidad | Usa en su lugar |
|---|---|
| Elemento DOM | Template ref |
| Router, i18n, plugins personalizados | Sus composables (`useRouter`, `useI18n`) |
| Datos del padre | `inject()` |
| Emit desde un composable | Pasa `emit` como parámetro |
| Contexto de app en una librería | `getCurrentInstance()` es aceptable (envuélvelo) |
| Código de aplicación | Nunca uses `getCurrentInstance()` |

Ver también: [¿Qué es Provide/Inject?](/es/q/provide-inject) · [¿Cómo funcionan los template refs?](/es/q/template-refs)

## Referencias

- [getCurrentInstance](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) - Vue.js docs
- [provide](https://vuejs.org/api/composition-api-dependency-injection.html#provide) - Vue.js docs
- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
