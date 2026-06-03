---
order: 8
title: '¿Cuál es la diferencia entre v-if y v-show?'
difficulty: 'beginner'
tags: ['directives']
summary: 'v-if añade/elimina elementos del DOM (mayor coste de cambio, cero coste oculto). v-show cambia CSS display (cambio barato, siempre renderizado).'
---

Ambas directivas muestran y ocultan elementos según una condición, pero lo hacen de formas completamente distintas, y esa diferencia tiene implicaciones reales de rendimiento.

## v-if: añade y elimina del DOM

[`v-if`](https://vuejs.org/guide/essentials/conditional.html#v-if) elimina por completo el elemento (y sus hijos, componentes y listeners de eventos) del DOM cuando la condición es `false`. Cuando pasa a ser `true`, Vue crea todo desde cero: ejecuta `setup`, monta el componente y dispara `onMounted`.

```vue
<template>
  <div v-if="showPanel">
    <!-- Este componente completo se destruye cuando showPanel es false -->
    <ExpensiveChart :data="chartData" />
  </div>
</template>
```

<PlaygroundLink code="<template>
  <div v-if=&quot;showPanel&quot;>
&#10;    <ExpensiveChart :data=&quot;chartData&quot; />
  </div>
</template>" />

Alternar `v-if` es costoso: Vue tiene que desmontar y reconstruir el subárbol del DOM cada vez. Pero si la condición es `false` en el renderizado inicial, no se crea nada. Coste cero.

## v-show: oculta con CSS

[`v-show`](https://vuejs.org/guide/essentials/conditional.html#v-show) siempre renderiza el elemento y lo mantiene en el DOM. Solo alterna `display: none`. El componente permanece montado, su estado se preserva y no se dispara ningún lifecycle hook al alternar.

```vue
<template>
  <div v-show="showPanel">
    <!-- Siempre en el DOM, solo oculto via CSS cuando showPanel es false -->
    <ExpensiveChart :data="chartData" />
  </div>
</template>
```

<PlaygroundLink code="<template>
  <div v-show=&quot;showPanel&quot;>
&#10;    <ExpensiveChart :data=&quot;chartData&quot; />
  </div>
</template>" />

Alternar es barato (un cambio de propiedad CSS), pero el renderizado inicial siempre paga el coste completo aunque el elemento empiece oculto.

## Cuándo usar cada uno

| Escenario                                                              | Usar                                                        | Por qué                                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| El usuario alterna algo con frecuencia (pestañas, dropdowns, tooltips) | `v-show`                                                    | Evita montajes/desmontajes repetidos                                  |
| La condición raramente cambia (feature flags, permisos)                | `v-if`                                                      | No pagues el coste de renderizar algo que quizás el usuario nunca vea |
| Árbol de componentes grande y costoso de montar                        | `v-show` si se alterna mucho, `v-if` si rara vez se muestra | Equilibra el coste inicial vs el coste de alternancia                 |
| Necesitas cadenas `v-else` o `v-else-if`                               | `v-if`                                                      | `v-show` no soporta cadenas else                                      |
| Necesitas envolver varios elementos con `<template>`                   | `v-if`                                                      | `v-show` no funciona en `<template>`                                  |

**Usa `v-if` por defecto** salvo que tengas una razón específica para mantener el elemento en el DOM. La mayoría de condiciones en aplicaciones reales no se alternan con suficiente frecuencia para que `v-show` marque la diferencia.

Ver también: [¿Qué es el renderizado condicional en Vue?](/es/q/conditional-rendering) · [¿Por qué no debes usar v-if con v-for?](/es/q/v-if-with-v-for)

## Referencias

- [Renderizado Condicional](https://vuejs.org/guide/essentials/conditional.html) - Docs de Vue.js
- [v-if](https://vuejs.org/api/built-in-directives.html#v-if) - Docs de Vue.js
- [v-show](https://vuejs.org/api/built-in-directives.html#v-show) - Docs de Vue.js
