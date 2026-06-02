---
order: 30
title: "¿Por qué el CSS con scoped no afecta a elementos de componentes hijos?"
difficulty: "intermediate"
tags: ["components", "errors", "teleport"]
summary: "Scoped CSS añade atributos data-v-xxxxx a elementos. Los hijos no reciben ese atributo, así que los selectores no aplican. Usa :deep() para afectar hijos."
---

Porque el CSS con scoped en Vue funciona añadiendo un atributo único `data-v-xxxxx` a los elementos del template del componente actual y añadiéndolo a cada selector CSS. Los elementos renderizados por componentes hijos no tienen ese atributo, así que los selectores no coinciden.

```vue
<template>
  <div class="wrapper">
    <DatePicker />
  </div>
</template>

<style scoped>
/* Esto no funcionará — .calendar-popup está dentro del template de DatePicker */
.wrapper .calendar-popup {
  background: white;
}
</style>
```

El CSS generado tiene la forma `.wrapper[data-v-abc123] .calendar-popup[data-v-abc123]`, pero `.calendar-popup` no tiene `data-v-abc123`.

## Cómo solucionarlo

Usar el selector `:deep()` para penetrar en los componentes hijos:

```vue
<style scoped>
.wrapper :deep(.calendar-popup) {
  background: white;
}

.wrapper :deep(.date-input) {
  border-color: blue;
}
</style>
```

Siempre acotar `:deep()` a una clase padre para limitar su alcance:

```vue
<style scoped>
/* Demasiado amplio — afecta a TODOS los .btn en cualquier hijo */
:deep(.btn) { background: blue; }

/* Mejor — solo .btn dentro de .wrapper */
.wrapper :deep(.btn) { background: blue; }
</style>
```

## Excepción: el elemento raíz del hijo

El **elemento raíz** de un componente hijo SÍ se ve afectado por el CSS con scoped del padre. Vue lo hace intencionalmente para que los padres puedan controlar el layout (márgenes, posicionamiento) de sus hijos:

```vue
<style scoped>
/* Esto funciona sin :deep() — apunta al elemento raíz del hijo */
.date-picker {
  margin-bottom: 1rem;
}
</style>
```

## Sintaxis antigua (no usar)

```css
.parent >>> .child { }     /* no funciona con SCSS */
.parent /deep/ .child { }  /* obsoleto */
.parent ::v-deep .child { } /* sintaxis antigua de Vue 3 */
```

En Vue 3, `:deep()` es la única sintaxis soportada.

Ver también: [¿Cómo funcionan los estilos scoped, CSS Modules y clases dinámicas?](/es/q/css-scoped-modules-dynamic) · [¿Cómo interactúan los estilos scoped con Teleport?](/es/q/teleport-scoped-styles)

## Referencias

- [Scoped CSS](https://vuejs.org/api/sfc-css-features.html#scoped-css) - Vue.js docs
- [Deep Selectors](https://vuejs.org/api/sfc-css-features.html#deep-selectors) - Vue.js docs
