---
order: 86
title: '¿Cómo funcionan las propiedades computed con escritura?'
difficulty: 'advanced'
tags: ['reactivity', 'pinia', 'v-model']
summary: 'Un computed con setter: leer deriva el valor, escribir actualiza la fuente subyacente. Uso común: enlace computed bidireccional para transformaciones de formularios.'
---

Una propiedad [computed](https://vuejs.org/api/reactivity-core.html#computed) normal es de solo lectura: deriva un valor de las dependencias reactivas. Un computed con escritura añade un setter, por lo que puedes asignarle un valor y el setter actualiza los datos fuente subyacentes.

## Ejemplo básico

```ts
import { ref, computed } from 'vue'

const firstName = ref('Ana')
const lastName = ref('García')

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value: string) => {
    const [first, ...rest] = value.split(' ')
    firstName.value = first
    lastName.value = rest.join(' ')
  }
})

console.log(fullName.value) // "Ana García"

fullName.value = 'Luis Fernández'
console.log(firstName.value) // "Luis"
console.log(lastName.value) // "Fernández"
```

El getter deriva el valor. El setter descompone el valor asignado de vuelta en los refs fuente.

## Con v-model

Las propiedades computed con escritura son útiles para vincular `v-model` a un valor derivado:

```vue
<script setup>
import { ref, computed } from 'vue'

const price = ref(100)
const taxRate = ref(0.21)

const priceWithTax = computed({
  get: () => price.value * (1 + taxRate.value),
  set: (total: number) => {
    price.value = total / (1 + taxRate.value)
  }
})
</script>

<template>
  <label>
    Price (with tax):
    <input v-model.number="priceWithTax" type="number" />
  </label>
  <p>Base price: {{ price.toFixed(2) }}</p>
</template>
```

<PlaygroundLink code="<script setup>
import { ref, computed } from 'vue'
&#10;const price = ref(100)
const taxRate = ref(0.21)
&#10;const priceWithTax = computed({
  get: () => price.value * (1 + taxRate.value),
  set: (total: number) => {
    price.value = total / (1 + taxRate.value)
  }
})
</script>
&#10;<template>
  <label>
    Price (with tax):
    <input v-model.number=&quot;priceWithTax&quot; type=&quot;number&quot; />
  </label>
  <p>Base price: {{ price.toFixed(2) }}</p>
</template>" />

El usuario edita el total y el setter calcula el precio base.

## Patrón de formateo

Convierte entre el formato de visualización y el formato almacenado:

```ts
const dateRaw = ref('2024-03-15')

const dateFormatted = computed({
  get: () => {
    const [y, m, d] = dateRaw.value.split('-')
    return `${d}/${m}/${y}`
  },
  set: (display: string) => {
    const [d, m, y] = display.split('/')
    dateRaw.value = `${y}-${m}-${d}`
  }
})

// dateFormatted.value → "15/03/2024"
// dateFormatted.value = "20/06/2024" → dateRaw se convierte en "2024-06-20"
```

## Proxy para el estado de un store

Cuando necesitas `v-model` en un valor de un store de Pinia:

```ts
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const store = useSettingsStore()

const theme = computed({
  get: () => store.theme,
  set: (value: string) => store.setTheme(value)
})
```

```vue
<template>
  <select v-model="theme">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</template>
```

<PlaygroundLink code="<template>
  <select v-model=&quot;theme&quot;>
    <option value=&quot;light&quot;>Light</option>
    <option value=&quot;dark&quot;>Dark</option>
  </select>
</template>" />

## Reglas

- El setter debe actualizar las fuentes que lee el getter. Si no lo hace, el valor computed quedará desactualizado.
- No realices operaciones asíncronas ni efectos secundarios en los getters. Los setters pueden activar efectos secundarios (como acciones del store) ya que se invocan explícitamente.
- Si te encuentras escribiendo lógica compleja en el setter, considera si un método o un watcher sería más claro.

## Cuándo usar computed con escritura

| Escenario                                       | ¿Computed con escritura?        |
| ----------------------------------------------- | ------------------------------- |
| v-model en un valor derivado o formateado       | Sí                              |
| Binding bidireccional a una propiedad del store | Sí                              |
| Conversión de unidades (km/millas, C/F)         | Sí                              |
| Transformación compleja de varios pasos         | Probablemente no, usa un método |
| Operaciones asíncronas en el set                | No, usa un watcher              |

Ver también: [¿Cuál es la diferencia entre computed y watch?](/es/q/computed-vs-watch) · [¿Cómo funciona v-model con componentes?](/es/q/v-model-custom-components)

## Referencias

- [computed() - Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [v-model - Vue guide](https://vuejs.org/guide/components/v-model.html)
- [Computed Properties - Vue guide](https://vuejs.org/guide/essentials/computed.html)
