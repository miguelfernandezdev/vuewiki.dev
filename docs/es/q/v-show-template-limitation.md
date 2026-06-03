---
order: 11
title: '¿Por qué v-show no funciona en elementos template?'
difficulty: 'beginner'
tags: ['directives', 'errors']
summary: 'v-show cambia CSS display, pero <template> no se renderiza en el DOM. No hay elemento para poner display:none. Usa v-if en su lugar.'
---

Porque `v-show` funciona alternando la propiedad CSS `display`, y los elementos `<template>` no se renderizan en el DOM. No existe un elemento real al que aplicar `display: none`.

```vue
<!-- v-show en <template> no hace nada en silencio -->
<template v-show="isVisible">
  <h1>Title</h1>
  <p>Content</p>
</template>
<!-- Estos elementos SIEMPRE serán visibles -->
```

<PlaygroundLink code="<template v-show=&quot;isVisible&quot;>
  <h1>Title</h1>
  <p>Content</p>
</template>" />

Otra limitación: `v-show` no admite `v-else`.

```vue
<!-- v-else NO funciona con v-show -->
<div v-show="isLoggedIn">Welcome!</div>
<div v-else>Please log in</div>
<!-- roto -->
```

<PlaygroundLink code="<div v-show=&quot;isLoggedIn&quot;>Welcome!</div>
<div v-else>Please log in</div>" />

## Cómo solucionarlo

**Para alternar múltiples elementos:** usa `v-if` en `<template>` (sí lo admite), o envuélvelos en un elemento real con `v-show`.

```vue
<!-- v-if funciona en <template> -->
<template v-if="isVisible">
  <h1>Title</h1>
  <p>Content</p>
</template>

<!-- O envuelve en un elemento real -->
<div v-show="isVisible">
  <h1>Title</h1>
  <p>Content</p>
</div>
```

<PlaygroundLink code="<template v-if=&quot;isVisible&quot;>
  <h1>Title</h1>
  <p>Content</p>
</template>
&#10;<div v-show=&quot;isVisible&quot;>
  <h1>Title</h1>
  <p>Content</p>
</div>" />

**Para el comportamiento "else" con v-show:** usa una condición negada.

```vue
<div v-show="isLoggedIn">Welcome!</div>
<div v-show="!isLoggedIn">Please log in</div>
```

<PlaygroundLink code="<div v-show=&quot;isLoggedIn&quot;>Welcome!</div>
<div v-show=&quot;!isLoggedIn&quot;>Please log in</div>" />

## Referencia rápida

| Necesidad                                      | Usa                                  |
| ---------------------------------------------- | ------------------------------------ |
| Alternar múltiples elementos sin un contenedor | `<template v-if>`                    |
| Alternado frecuente, elemento único            | `v-show` en el elemento              |
| Alternado frecuente, necesitas "else"          | Dos `v-show` con condiciones negadas |
| Ramas v-else / v-else-if                       | `v-if` / `v-else`                    |

Ver también: [¿Por qué no se puede usar v-if y v-for en el mismo elemento?](/es/q/v-if-with-v-for) · [¿Qué son los modificadores de eventos?](/es/q/event-modifier-order) · [¿Qué es v-once y v-memo?](/es/q/v-once-v-memo)

## Referencias

- [v-show](https://vuejs.org/api/built-in-directives.html#v-show) - Vue.js docs
- [v-if vs v-show](https://vuejs.org/guide/essentials/conditional.html#v-if-vs-v-show) - Vue.js docs
- [Conditional Rendering](https://vuejs.org/guide/essentials/conditional.html) - Vue.js docs
