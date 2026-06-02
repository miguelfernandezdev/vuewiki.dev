---
order: 69
title: "¿Cómo funcionan las render functions y JSX en Vue?"
difficulty: "intermediate"
tags: ["components", "v-model"]
---

Las render functions son una alternativa a los templates. En lugar de escribir markup estilo HTML, se usa la función `h()` (o JSX) para crear vnodes de forma programática. Los templates se compilan en render functions en tiempo de build, así que las render functions son lo que Vue ejecuta realmente.

## La función h()

`h` significa "hyperscript" (JavaScript que crea HTML). Recibe una etiqueta (o componente), props e hijos:

```ts
import { h, ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    return () => h('button', {
      onClick: () => count.value++
    }, `Count: ${count.value}`)
  }
}
```

Cuando `setup` devuelve una función en lugar de un objeto, esa función es la render function.

## JSX (la alternativa legible)

JSX hace que las render functions se parezcan más a los templates. Requiere `@vitejs/plugin-vue-jsx`:

```tsx
import { ref, defineComponent } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0)

    return () => (
      <button onClick={() => count.value++}>
        Count: {count.value}
      </button>
    )
  }
})
```

## Cuándo tienen sentido las render functions

Los templates cubren el 95% de los casos. Las render functions son útiles cuando el output es demasiado dinámico para la sintaxis de template:

```ts
import { h } from 'vue'

// Nivel de encabezado dinámico: h1, h2, h3...
function DynamicHeading(props: { level: number }, { slots }) {
  return h(`h${props.level}`, slots.default?.())
}
DynamicHeading.props = ['level']
```

```tsx
// El mismo componente en JSX
function DynamicHeading(props: { level: number }, { slots }) {
  const Tag = `h${props.level}`
  return <Tag>{slots.default?.()}</Tag>
}
```

Hacer esto en un template requeriría una cadena de `v-if` para cada nivel de encabezado.

## Patrones clave

**Las listas necesitan keys**, igual que en los templates:

```ts
return () => h('ul',
  items.value.map(item => h('li', { key: item.id }, item.name))
)
```

**Los modificadores de evento** usan `withModifiers` y `withKeys`:

```ts
import { h, withModifiers, withKeys } from 'vue'

h('button', {
  onClick: withModifiers(handleClick, ['stop', 'prevent'])
}, 'Click')

h('input', {
  onKeyup: withKeys(handleEnter, ['enter'])
})
```

**v-model** se expande manualmente:

```ts
h(CustomInput, {
  modelValue: text.value,
  'onUpdate:modelValue': (val) => { text.value = val }
})
```

**Las directivas personalizadas** usan `withDirectives`:

```ts
import { h, withDirectives } from 'vue'

const vFocus = { mounted: (el) => el.focus() }

withDirectives(h('input'), [[vFocus]])
```

## Templates vs render functions

| | Templates | Render functions / JSX |
|---|---|---|
| Legibilidad | Estilo HTML, familiar | JavaScript, más verboso |
| Optimizaciones del compilador | Static hoisting, patch flags | Ninguna (se opta por salir) |
| Output dinámico | Limitado por la sintaxis de directivas | Flexibilidad total de JavaScript |
| Soporte en IDE | Herramientas específicas de Vue (Volar) | TypeScript/JSX estándar |
| Caso de uso | La mayoría de componentes | Lógica de render muy dinámica |

Preferir templates por defecto. Usar render functions cuando el template sería incómodo o imposible de expresar de forma declarativa.

Ver también: [¿Qué son los componentes funcionales?](/es/q/functional-components) · [¿Qué son los slots?](/es/q/slots)

## Referencias

- [Render Functions & JSX](https://vuejs.org/guide/extras/render-function.html) - Vue.js docs
- [h()](https://vuejs.org/api/render-function.html#h) - Vue.js docs
