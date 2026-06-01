---
order: 37
title: "¿Por qué mi propiedad computed no se actualiza cuando cambia una dependencia?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
---

Probablemente porque la dependencia nunca se accedió durante la primera ejecución. Vue rastrea las dependencias de computed registrando qué propiedades reactivas se leen cuando se ejecuta el getter. Si la lógica condicional impide que se lea una propiedad, Vue nunca sabe que es una dependencia.

```ts
const isEnabled = ref(false)
const data = ref('important')

const result = computed(() => {
  if (!isEnabled.value) {
    return 'disabled' // return temprano, data.value nunca se lee
  }
  return data.value
})
```

Cuando `isEnabled` es `false` en la primera ejecución, `data.value` nunca se accede. Vue no lo rastrea. Más tarde, cuando `data` cambia, el computed no recalcula porque Vue no sabe que `result` depende de `data`.

Lo mismo ocurre con la evaluación por cortocircuito:

```ts
const password = ref('')
const confirm = ref('')

// Si password está vacío, confirm.value nunca se lee
const isValid = computed(() => {
  return password.value && password.value === confirm.value
})
```

## Cómo solucionarlo

Accede a todas las dependencias al principio del getter, antes de cualquier lógica condicional:

```ts
const result = computed(() => {
  const enabled = isEnabled.value
  const currentData = data.value // siempre se accede

  if (!enabled) {
    return 'disabled'
  }
  return currentData
})
```

```ts
const isValid = computed(() => {
  const pwd = password.value
  const conf = confirm.value // siempre se accede

  return pwd && pwd === conf
})
```

Este patrón funciona porque Vue rastrea cada acceso a `.value` que ocurre durante la ejecución del getter, independientemente de si el valor se usa en el return.
