---
order: 42
title: "¿Por qué los emits no declarados se disparan dos veces?"
difficulty: "intermediate"
tags: ["components", "errors"]
---

Porque cuando re-emites un evento nativo (como `click`) sin declararlo en `defineEmits`, el listener del padre acaba adjunto en dos sitios: una vez a través del fallthrough de `$attrs` en el elemento raíz, y otra a través de tu llamada explícita a `$emit()`.

```vue
<!-- MyButton.vue — SIN defineEmits -->
<template>
  <button @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<!-- Parent.vue -->
<MyButton @click="handleClick">Click me</MyButton>
```

Lo que ocurre en cada clic:

1. El clic nativo se dispara en el `<button>`
2. Como `click` no está declarado en emits, el `@click` del padre cae a través del elemento raíz via `$attrs`, disparando `handleClick`
3. El `@click="$emit('click', $event)"` también se dispara, emitiendo un evento de componente que vuelve a activar `handleClick`

Resultado: `handleClick` se ejecuta **dos veces**.

## Cómo solucionarlo

**Opción 1:** Declara el emit. Esto le dice a Vue que `@click` en el componente es un evento de componente, no uno nativo, así que no caerá a través.

```vue
<script setup>
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button @click="emit('click', $event)">
    <slot />
  </button>
</template>
```

**Opción 2:** No re-emitas. Si el componente tiene un único elemento raíz, el evento nativo cae a través automáticamente.

```vue
<!-- MyButton.vue — no se necesita emit, click cae al <button> -->
<template>
  <button>
    <slot />
  </button>
</template>

<!-- Parent.vue — funciona, se dispara una vez -->
<MyButton @click="handleClick">Click me</MyButton>
```

La regla es clara: si haces `$emit` de un nombre de evento nativo, debes declararlo en `defineEmits`. De lo contrario, el listener existe en dos sitios.
