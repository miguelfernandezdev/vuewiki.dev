---
order: 46
title: "¿Por qué los estilos con scoped no se aplican al contenido teletransportado?"
difficulty: "intermediate"
tags: ["components", "errors"]
---

Porque los estilos con scoped funcionan añadiendo un atributo `data-v-xxxxx` a los elementos del subárbol DOM del componente. Cuando `<Teleport>` mueve elementos a otra parte del DOM (como `body`), esos elementos salen del subárbol del componente, por lo que los selectores de atributo con scoped dejan de coincidir.

```vue
<template>
  <Teleport to="body">
    <div class="modal">
      <p class="modal-text">Este texto no tendrá estilos</p>
    </div>
  </Teleport>
</template>

<style scoped>
/* .modal[data-v-abc123] — pero .modal está ahora bajo <body>, no aquí */
.modal {
  background: white;
}

.modal-text {
  color: blue; /* no se aplica */
}
</style>
```

## Cómo solucionarlo

**Opción 1 (recomendada):** Usa un bloque de estilos separado sin scoped con nombres de clase con prefijo.

```vue
<style scoped>
/* Los estilos normales del componente siguen con scoped */
.trigger-button { color: blue; }
</style>

<style>
/* El contenido teletransportado usa estilos sin scoped */
.my-modal { background: white; padding: 20px; }
.my-modal-text { color: blue; }
</style>
```

**Opción 2:** Usa CSS Modules. Los nombres de clase se procesan en tiempo de compilación, así que el ámbito no depende de la posición en el DOM.

```vue
<template>
  <Teleport to="body">
    <div :class="$style.modal">
      <p :class="$style.text">Con estilos correctamente aplicados</p>
    </div>
  </Teleport>
</template>

<style module>
.modal { background: white; padding: 20px; }
.text { color: blue; }
</style>
```

**Opción 3:** Usa `:deep()` desde un bloque con scoped.

```vue
<style scoped>
:deep(.modal) { background: white; }
:deep(.modal-text) { color: blue; }
</style>
```

Esto funciona pero anula el propósito del scoped. CSS Modules o un bloque dedicado sin scoped son soluciones más limpias para el contenido teletransportado.
