---
order: 20
title: '¿Por qué mutar props directamente genera warnings?'
difficulty: 'beginner'
tags: ['components', 'errors', 'v-model']
summary: 'Los props son de solo lectura (flujo unidireccional). Mutarlos directamente causa advertencias porque el padre sobrescribirá el cambio en el próximo re-render.'
---

Porque Vue impone el **flujo de datos unidireccional**: las props van hacia abajo (padre a hijo), los eventos van hacia arriba (hijo a padre). Si un hijo modifica una prop directamente, el padre no se entera, y la próxima vez que el padre se re-renderice, sobreescribirá el cambio del hijo.

```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()

function increment() {
  props.count++ // ⚠️ Warning: Attempting to mutate prop "count"
}
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const props = defineProps<{ count: number }>()
&#10;function increment() {
  props.count++ // ⚠️ Warning: Attempting to mutate prop &quot;count&quot;
}
</script>" />

Vue muestra este warning porque casi siempre es un bug. El propietario de los datos (padre) y quien los muta (hijo) están desincronizados.

## Cómo solucionarlo

**Opción 1:** Emitir un evento y dejar que el padre gestione el cambio.

```vue
<!-- Hijo -->
<script setup lang="ts">
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ update: [value: number] }>()

function increment() {
  emit('update', props.count + 1)
}
</script>

<!-- Padre -->
<Counter :count="count" @update="count = $event" />
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ update: [value: number] }>()
&#10;function increment() {
  emit('update', props.count + 1)
}
</script>
&#10;<Counter :count=&quot;count&quot; @update=&quot;count = $event&quot; />" />

**Opción 2:** Usar `v-model` (atajo para el patrón anterior).

```vue
<!-- Hijo -->
<script setup lang="ts">
const count = defineModel<number>()
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>

<!-- Padre -->
<Counter v-model="count" />
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const count = defineModel<number>()
</script>
&#10;<template>
  <button @click=&quot;count++&quot;>{{ count }}</button>
</template>
&#10;<Counter v-model=&quot;count&quot; />" />

**Opción 3:** Usar una copia local si la prop es solo un valor inicial.

```ts
const props = defineProps<{ initialCount: number }>()
const count = ref(props.initialCount)
```

Llama a la prop `initialX` para indicar que solo se usa una vez y no se mantendrá sincronizada con el padre.

Ver también: [¿Cuál es la diferencia entre props y state?](/es/q/props-vs-state) · [¿Qué es lifting state up?](/es/q/lifting-state-up) · [¿Qué es el flujo de datos unidireccional?](/es/q/flux-unidirectional-data-flow)

## Referencias

- [One-Way Data Flow](https://vuejs.org/guide/components/props.html#one-way-data-flow) - Vue.js docs
- [Component Events](https://vuejs.org/guide/components/events.html) - Vue.js docs
