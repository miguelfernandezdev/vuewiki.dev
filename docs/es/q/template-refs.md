---
order: 58
title: "¿Cómo funcionan los template refs?"
difficulty: "intermediate"
tags: ["components", "composition-api"]
---

Los template refs te dan acceso directo a un elemento DOM o a la instancia de un componente hijo. Añades un atributo `ref` en el template y lees el valor correspondiente en el script después de que el componente se monte.

## Patrón anterior (antes de Vue 3.5)

El nombre de la variable en el script debe coincidir exactamente con el atributo `ref`. Si no coinciden, el ref es silenciosamente `null` sin ningún aviso.

```vue
<script setup>
import { ref, onMounted } from 'vue'

const inputEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<template>
  <!-- el nombre DEBE ser "inputEl" para coincidir con la variable -->
  <input ref="inputEl" />
</template>
```

El punto frágil: renombra la variable durante una refactorización y la conexión se rompe silenciosamente.

## useTemplateRef (Vue 3.5+)

`useTemplateRef` desacopla el nombre de la variable del atributo ref. El argumento de texto es el punto de conexión, y la variable puede llamarse de cualquier manera.

```vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'

const searchInput = useTemplateRef('search-box')

onMounted(() => {
  searchInput.value?.focus()
})
</script>

<template>
  <input ref="search-box" type="search" />
</template>
```

Ventajas: autocompletado en el IDE para nombres de ref, mejor inferencia de TypeScript, y los errores tipográficos producen errores visibles en lugar de nulls silenciosos.

## Refs con v-for

Cuando se usan dentro de `v-for`, el ref se puebla con un array de elementos. Esto sigue requiriendo el patrón `ref()` clásico porque `useTemplateRef` no soporta la población en array.

```vue
<script setup>
import { ref, onMounted } from 'vue'

const itemRefs = ref<HTMLLIElement[]>([])

onMounted(() => {
  itemRefs.value.forEach(el => {
    console.log(el.textContent)
  })
})
</script>

<template>
  <ul>
    <li v-for="item in items" ref="itemRefs" :key="item.id">
      {{ item.text }}
    </li>
  </ul>
</template>
```

## Refs en componentes

Un template ref en un componente hijo te da la instancia pública del componente, no un elemento DOM. Con `<script setup>`, el hijo no expone nada por defecto. Necesitas `defineExpose` para hacer accesibles las propiedades.

```vue
<!-- ChildForm.vue -->
<script setup>
import { ref } from 'vue'

const formData = ref({ name: '' })

function validate() {
  return formData.value.name.length > 0
}

defineExpose({ validate })
</script>
```

```vue
<!-- Parent.vue -->
<script setup>
import { useTemplateRef } from 'vue'

const formRef = useTemplateRef('child-form')

function submit() {
  if (formRef.value?.validate()) {
    // continuar
  }
}
</script>

<template>
  <ChildForm ref="child-form" />
  <button @click="submit">Enviar</button>
</template>
```

## Cuándo usar template refs

| Situación | ¿Usar un ref? |
|---|---|
| Enfocar un input, hacer scroll a un elemento | Sí |
| Integrar una librería no Vue (gráfico, mapa) | Sí |
| Leer dimensiones de un elemento | Sí |
| Cambiar texto o alternar clases | No, usa datos reactivos y bindings |
| Escuchar eventos | No, usa `@evento` |
