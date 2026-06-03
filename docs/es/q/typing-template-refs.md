---
order: 108
title: '¿Cómo se tipan los template refs en TypeScript?'
difficulty: 'intermediate'
tags: ['typescript', 'components', 'watchers']
summary: 'Declara como ref<HTMLElement | null>(null). Usa optional chaining (el.value?.focus()) o accede en onMounted donde está garantizado que existe.'
---

Los template refs comienzan como `null` y se convierten en el elemento DOM o en la instancia del componente después del montaje. En TypeScript, debes tener en cuenta esto con un tipo unión y proteger el acceso con optional chaining o hooks del ciclo de vida.

## Refs de elementos DOM

```vue
<script setup lang="ts">
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="inputRef" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const inputRef = ref<HTMLInputElement | null>(null)
&#10;onMounted(() => {
  inputRef.value?.focus()
})
</script>
&#10;<template>
  <input ref=&quot;inputRef&quot; />
</template>" />

</template>" />

El tipo es `HTMLInputElement | null` porque el ref es `null` durante el setup y se convierte en el elemento solo después de que el componente se monta.

## useTemplateRef (Vue 3.5+)

`useTemplateRef` separa el nombre del template ref de la variable y mejora la inferencia de tipos:

```vue
<script setup lang="ts">
const input = useTemplateRef<HTMLInputElement>('my-input')

onMounted(() => {
  input.value?.focus()
})
</script>

<template>
  <input ref="my-input" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const input = useTemplateRef<HTMLInputElement>('my-input')
&#10;onMounted(() => {
  input.value?.focus()
})
</script>
&#10;<template>
  <input ref=&quot;my-input&quot; />
</template>" />

</template>" />

La cadena `'my-input'` coincide con el atributo `ref` en el template. El nombre de la variable `input` es independiente.

## Refs de componentes

Usa `InstanceType<typeof Component>` para tipar un ref a un componente hijo:

```vue
<script setup lang="ts">
import ChildForm from './ChildForm.vue'

const formRef = ref<InstanceType<typeof ChildForm> | null>(null)

function submit() {
  formRef.value?.validate()
}
</script>

<template>
  <ChildForm ref="formRef" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import ChildForm from './ChildForm.vue'
&#10;const formRef = ref<InstanceType<typeof ChildForm> | null>(null)
&#10;function submit() {
  formRef.value?.validate()
}
</script>
&#10;<template>
  <ChildForm ref=&quot;formRef&quot; />
</template>" />

</template>" />

El hijo debe exponer el método con `defineExpose`:

```vue
<!-- ChildForm.vue -->
<script setup lang="ts">
function validate() {
  // lógica de validación
  return isValid.value
}

defineExpose({ validate })
</script>
```

<PlaygroundLink code="<!-- ChildForm.vue -->
<script setup lang=&quot;ts&quot;>
function validate() {
  // lógica de validación
  return isValid.value
}
&#10;defineExpose({ validate })
</script>" />

Sin `defineExpose`, el padre no puede acceder a ningún estado interno ni a los métodos del hijo.

## Refs con v-if

Cuando un elemento está detrás de `v-if`, el ref vuelve a ser `null` cuando la condición es false:

```vue
<script setup lang="ts">
const showModal = ref(false)
const modalRef = ref<HTMLDivElement | null>(null)

watch(modalRef, (el) => {
  if (el) {
    el.focus() // el elemento acaba de montarse
  }
})
</script>

<template>
  <div v-if="showModal" ref="modalRef" tabindex="-1">Contenido del modal</div>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const showModal = ref(false)
const modalRef = ref<HTMLDivElement | null>(null)
&#10;watch(modalRef, (el) => {
  if (el) {
    el.focus() // el elemento acaba de montarse
  }
})
</script>
&#10;<template>
  <div v-if=&quot;showModal&quot; ref=&quot;modalRef&quot; tabindex=&quot;-1&quot;>Contenido del modal</div>
</template>" />

Usa siempre optional chaining o comprobaciones de null cuando el target del ref puede renderizarse de forma condicional.

## Refs con v-for

Con `v-for`, el ref se convierte en un array. Usa un ref de función para poblarlo:

```vue
<script setup lang="ts">
const items = ref(['a', 'b', 'c'])
const itemRefs = ref<(HTMLLIElement | null)[]>([])

onMounted(() => {
  itemRefs.value[0]?.focus()
})
</script>

<template>
  <ul>
    <li
      v-for="(item, index) in items"
      :key="item"
      :ref="
        (el) => {
          itemRefs[index] = el as HTMLLIElement
        }
      "
    >
      {{ item }}
    </li>
  </ul>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const items = ref(['a', 'b', 'c'])
const itemRefs = ref<(HTMLLIElement | null)[]>([])
&#10;onMounted(() => {
  itemRefs.value[0]?.focus()
})
</script>
&#10;<template>
  <ul>
    <li
      v-for=&quot;(item, index) in items&quot;
      :key=&quot;item&quot;
      :ref=&quot;
        (el) => {
          itemRefs[index] = el as HTMLLIElement
        }
      &quot;
    >
      {{ item }}
    </li>
  </ul>
</template>" />

## Tras operaciones asíncronas

Si haces `await` dentro de `onMounted`, el componente podría haberse desmontado cuando la promesa se resuelva:

```ts
onMounted(async () => {
  await fetchData()

  // el componente podría no existir ya, comprueba antes de acceder
  if (inputRef.value) {
    inputRef.value.scrollTop = 0
  }
})
```

## Referencia rápida

| Escenario             | Tipo                                                  |
| --------------------- | ----------------------------------------------------- |
| Elemento DOM          | `ref<HTMLDivElement \| null>(null)`                   |
| Elemento input        | `ref<HTMLInputElement \| null>(null)`                 |
| Elemento canvas       | `ref<HTMLCanvasElement \| null>(null)`                |
| Componente hijo       | `ref<InstanceType<typeof MyComponent> \| null>(null)` |
| Array desde v-for     | `ref<(HTMLLIElement \| null)[]>([])`                  |
| useTemplateRef (3.5+) | `useTemplateRef<HTMLInputElement>('nombre')`          |

Ver también: [¿Cómo funcionan las template refs?](/es/q/template-refs) · [¿Por qué una template ref es null dentro de v-if?](/es/q/template-ref-null-v-if) · [¿Qué es defineExpose?](/es/q/define-expose)

## Referencias

- [Typing Template Refs](https://vuejs.org/guide/typescript/composition-api.html#typing-template-refs) - Vue.js docs
- [useTemplateRef()](https://vuejs.org/api/composition-api-helpers.html#usetemplateref) - Vue.js docs
