---
order: 128
title: '¿Cuándo usar el hook updated y cuáles son sus implicaciones de rendimiento?'
difficulty: 'advanced'
tags: ['performance', 'reactivity', 'watchers']
summary: 'onUpdated se dispara tras CUALQUIER cambio de estado, no solo el que te interesa. Prefiere watch o computed para reacciones específicas.'
---

El hook `updated` (`onUpdated` en Composition API) se ejecuta después de cada cambio de estado reactivo que provoca un re-render. Se dispara ante CUALQUIER cambio de estado en el componente, no solo ante el que te interesa. Esto lo convierte en un lugar peligroso para operaciones costosas, llamadas a APIs o mutaciones de estado. Para la mayoría de los casos, [watch](https://vuejs.org/api/reactivity-core.html#watch) o [computed](https://vuejs.org/api/reactivity-core.html#computed) son una mejor opción.

## Cómo funciona updated

```vue
<script setup>
import { ref, onUpdated } from 'vue'

const name = ref('Alice')
const count = ref(0)

onUpdated(() => {
  console.log('Component re-rendered')
  // Se dispara cuando name O count cambian
  // No sabes cuál lo provocó
})
</script>
```

<PlaygroundLink code="<script setup>
import { ref, onUpdated } from 'vue'
&#10;const name = ref('Alice')
const count = ref(0)
&#10;onUpdated(() => {
  console.log('Component re-rendered')
  // Se dispara cuando name O count cambian
  // No sabes cuál lo provocó
})
</script>" />

El hook no tiene información sobre qué cambió. Solo indica que el DOM fue actualizado. Si el componente tiene 10 propiedades reactivas, el hook se dispara cuando cualquiera de ellas cambia.

## Los peligros

### Bucles infinitos por mutación de estado

```js
// MAL: mutar estado dentro de updated dispara otra actualización
export default {
  data() {
    return { renderCount: 0 }
  },
  updated() {
    this.renderCount++ // dispara re-render → updated → renderCount++ → ...
  }
}
```

Los cambios de estado dentro de `updated` provocan otro render, que llama a `updated` de nuevo. El navegador se bloquea.

### Llamadas a la API en cada render

```js
// MAL: se dispara en cada re-render, no solo cuando items cambia
export default {
  data() {
    return { items: [], searchQuery: '' }
  },
  updated() {
    fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify(this.items)
    })
  }
}
```

Escribir en el campo de búsqueda dispara un re-render, que dispara `updated`, que envía una llamada a la API. Cada pulsación de teclado llega al servidor, aunque `items` no haya cambiado.

### Datos derivados en updated

```js
// MAL: provoca otro ciclo de actualización
export default {
  data() {
    return { numbers: [1, 2, 3, 4, 5] }
  },
  updated() {
    this.sum = this.numbers.reduce((a, b) => a + b, 0)
  }
}
```

Asignar `this.sum` dispara un re-render, que dispara `updated` de nuevo. Aunque no entre en un bucle infinito (porque el valor se estabiliza), genera un ciclo de render innecesario adicional.

## Usar watch en su lugar

Los watchers son específicos. Solo se disparan cuando cambian los datos concretos que observan:

```vue
<script setup>
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

const items = ref([])

const syncToServer = useDebounceFn((newItems) => {
  fetch('/api/sync', { method: 'POST', body: JSON.stringify(newItems) })
}, 500)

watch(
  items,
  (newItems) => {
    syncToServer(newItems)
  },
  { deep: true }
)
</script>
```

<PlaygroundLink code="<script setup>
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
&#10;const items = ref([])
&#10;const syncToServer = useDebounceFn((newItems) => {
  fetch('/api/sync', { method: 'POST', body: JSON.stringify(newItems) })
}, 500)
&#10;watch(
  items,
  (newItems) => {
    syncToServer(newItems)
  },
  { deep: true }
)
</script>" />

Esto solo se dispara cuando `items` cambia, no cuando cualquier otro estado del componente cambia. El debounce evita saturar el servidor.

## Usar computed para datos derivados

```js
// BIEN: computed cachea y realiza el seguimiento automáticamente
export default {
  data() {
    return { numbers: [1, 2, 3, 4, 5] }
  },
  computed: {
    sum() {
      return this.numbers.reduce((a, b) => a + b, 0)
    }
  }
}
```

Sin ciclo de render adicional. El valor se actualiza en el mismo paso de render.

## Casos de uso válidos para updated

El hook es apropiado para sincronización DOM de bajo nivel que depende del output renderizado, no de datos específicos:

### Sincronizar una librería de terceros con el DOM

```vue
<script setup>
import { onUpdated } from 'vue'

onUpdated(() => {
  thirdPartyWidget.refresh()
})
</script>
```

<PlaygroundLink code="<script setup>
import { onUpdated } from 'vue'
&#10;onUpdated(() => {
  thirdPartyWidget.refresh()
})
</script>" />

Algunas librerías (renderizadores de gráficos, resaltadores de sintaxis) necesitan saber cuándo cambió el DOM para volver a medir o redibujar.

### Auto-scroll tras cambios de contenido

```vue
<script setup>
import { ref, onUpdated } from 'vue'

const chatContainer = (ref < HTMLElement) | (null > null)

onUpdated(() => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
})
</script>

<template>
  <div ref="chatContainer" class="chat">
    <div v-for="msg in messages" :key="msg.id">{{ msg.text }}</div>
  </div>
</template>
```

<PlaygroundLink code="<script setup>
import { ref, onUpdated } from 'vue'
&#10;const chatContainer = (ref < HTMLElement) | (null > null)
&#10;onUpdated(() => {
if (chatContainer.value) {
chatContainer.value.scrollTop = chatContainer.value.scrollHeight
}
})
</script>
&#10;<template>

  <div ref=&quot;chatContainer&quot; class=&quot;chat&quot;>
    <div v-for=&quot;msg in messages&quot; :key=&quot;msg.id&quot;>{{ msg.text }}</div>
  </div>
</template>" />

La posición del scroll depende de la altura del DOM renderizado, no directamente de los datos. Este es uno de los pocos casos donde `updated` tiene sentido.

### Con una condición de guarda

Si hay que usar `updated`, añadir una condición para evitar trabajo innecesario:

```js
export default {
  data() {
    return { content: '', lastSynced: '' }
  },
  updated() {
    if (this.content !== this.lastSynced) {
      this.syncContent()
      this.lastSynced = this.content
    }
  }
}
```

La guarda evita que la operación se ejecute cuando un cambio de estado no relacionado provocó el re-render.

## Cuándo usar cada opción

| Necesidad                                                   | Usar                         |
| ----------------------------------------------------------- | ---------------------------- |
| Reaccionar a un cambio de dato específico                   | `watch` / `watchEffect`      |
| Derivar un valor del estado reactivo                        | `computed`                   |
| Sincronizar librería de terceros tras actualización del DOM | `onUpdated`                  |
| Hacer scroll o medir el DOM tras el render                  | `onUpdated`                  |
| Llamadas a API cuando cambian datos                         | `watch` con debounce         |
| Actualizar estado derivado                                  | `computed` (nunca `updated`) |

Ver también: [¿Cómo agrupa Vue las actualizaciones del DOM?](/es/q/dom-update-batching) · [¿Qué es nextTick y cuándo lo necesitas?](/es/q/nexttick)

## Referencias

- [watch() - Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [computed() - Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [Lifecycle Hooks - Vue guide](https://vuejs.org/guide/essentials/lifecycle.html)
