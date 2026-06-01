---
order: 47
title: "¿Por qué mutar un objeto a través de defineModel no actualiza al padre?"
difficulty: "intermediate"
tags: ["components", "errors"]
---

Porque `defineModel()` solo emite `update:modelValue` cuando reasignas `model.value` en sí mismo. Mutar una propiedad dentro del objeto (`model.value.name = 'x'`) cambia el objeto en su lugar sin cambiar la referencia, por lo que Vue nunca dispara el evento de actualización y el padre queda desincronizado.

```vue
<script setup>
const model = defineModel<{ name: string; age: number }>()

function updateName(newName: string) {
  model.value.name = newName // el padre nunca se entera
}
</script>
```

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

## Cuidado con el batching

Cuando actualices varios campos, agrúpalos en una sola asignación. Dos spreads consecutivos pueden perder datos si el segundo lee un `model.value` desactualizado.

```ts
// arriesgado: el segundo spread puede usar un valor obsoleto
model.value = { ...model.value, a: '1' }
model.value = { ...model.value, b: '2' }

// seguro: asignación única
model.value = { ...model.value, a: '1', b: '2' }
```
