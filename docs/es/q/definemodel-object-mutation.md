---
order: 32
title: '¿Por qué mutar un objeto a través de defineModel no actualiza al padre?'
difficulty: 'intermediate'
tags: ['components', 'errors', 'v-model']
summary: 'Mutar propiedades del objeto no cambia la referencia, así que defineModel no emite. Reemplaza el objeto completo con spread para disparar la actualización.'
---

Porque `defineModel()` solo emite `update:modelValue` cuando reasignas `model.value` en sí mismo. Mutar una propiedad dentro del objeto (`model.value.name = 'x'`) cambia el objeto en su lugar sin cambiar la referencia, por lo que Vue nunca dispara el evento `update:modelValue`. Los watchers del padre sobre el binding v-model no detectan el cambio, aunque el template del padre sigue reflejando la mutación porque ambos lados comparten el mismo objeto reactivo.

```vue
<script setup>
const model = defineModel<{ name: string; age: number }>()

function updateName(newName: string) {
  model.value.name = newName // el padre nunca se entera
}
</script>
```

<PlaygroundLink code="<script setup>
const model = defineModel<{ name: string; age: number }>()
&#10;function updateName(newName: string) {
  model.value.name = newName // el padre nunca se entera
}
</script>" />

## Cómo solucionarlo

**Reemplaza el objeto completo** para que la referencia cambie y el evento se dispare.

```ts
function updateName(newName: string) {
  model.value = { ...model.value, name: newName }
}
```

Para arrays, la misma idea:

```ts
function addItem(item: string) {
  model.value = { ...model.value, items: [...model.value.items, item] }
}
```

## Las actualizaciones profundas se vuelven verbosas

```ts
// Actualización profundamente anidada
model.value = {
  ...model.value,
  user: {
    ...model.value.user,
    address: { ...model.value.user.address, city: 'Madrid' }
  }
}

// structuredClone es más limpio para objetos complejos
function updateCity(city: string) {
  const updated = structuredClone(model.value)
  updated.user.address.city = city
  model.value = updated
}
```

## Evita emisiones dobles innecesarias

Cuando actualices varios campos, agrúpalos en una sola asignación. Dos spreads consecutivos leen el `model.value` correcto (las asignaciones a refs son síncronas), pero cada uno crea una nueva referencia de objeto, emitiendo `update:modelValue` dos veces. Esto es innecesario y puede causar re-renders del padre.

```ts
// funciona, pero emite update:modelValue dos veces
model.value = { ...model.value, a: '1' }
model.value = { ...model.value, b: '2' }

// mejor: asignación única, una sola emisión
model.value = { ...model.value, a: '1', b: '2' }
```

Ver también: [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Cómo funcionan los bindings múltiples de v-model?](/es/q/multiple-v-model) · [¿Por qué mutar props causa warnings?](/es/q/mutating-props-warning)

## Referencias

- [defineModel()](https://vuejs.org/api/sfc-script-setup.html#definemodel) - Vue.js docs
- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
