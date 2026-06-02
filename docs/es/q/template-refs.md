---
order: 33
title: "¿Cómo funcionan los template refs?"
difficulty: "intermediate"
tags: ["components", "composition-api"]
summary: "Añade ref=\\\"nombre\\\" en el template y declara una ref() con el mismo nombre en script. Tras el mount, contiene el elemento DOM o la instancia del hijo."
---

Los template refs te dan acceso directo a un elemento DOM o a la instancia de un componente hijo. Añades un atributo `ref` en el template y lees el valor correspondiente en el script después de que el componente se monte. Consulta la guía de [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) para más detalles.

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

[`useTemplateRef`](https://vuejs.org/guide/essentials/template-refs.html) desacopla el nombre de la variable del atributo ref. El argumento de texto es el punto de conexión, y la variable puede llamarse de cualquier manera.

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

Cuando se usan dentro de `v-for`, el ref se puebla automáticamente con un array de elementos.

### useTemplateRef (Vue 3.5+, recomendado)

```vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'

const itemRefs = useTemplateRef<HTMLLIElement[]>('items')

onMounted(() => {
  itemRefs.value?.forEach(el => {
    console.log(el.textContent)
  })
})
</script>

<template>
  <ul>
    <li v-for="item in items" ref="items" :key="item.id">
      {{ item.text }}
    </li>
  </ul>
</template>
```

### Patrón con ref() (antes de Vue 3.5)

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

Ver también: [¿Qué es defineExpose y cuándo es necesario?](/es/q/define-expose) · [¿Se puede usar await directamente en script setup?](/es/q/await-in-script-setup)

## Referencias

- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [useTemplateRef](https://vuejs.org/api/composition-api-helpers.html#usetemplateref) - Vue.js docs
- [defineExpose](https://vuejs.org/api/sfc-script-setup.html#defineexpose) - Vue.js docs
