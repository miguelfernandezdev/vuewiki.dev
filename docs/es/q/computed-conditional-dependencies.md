---
order: 70
title: "¿Por qué mi propiedad computed no se actualiza cuando cambia una dependencia?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
summary: "Computed rastrea dependencias registrando qué propiedades reactivas se LEEN durante la ejecución. Si una rama no lee una propiedad, no se rastrea."
---

Probablemente porque la dependencia no se accedió durante la última ejecución. Vue rastrea las dependencias de [computed](https://vuejs.org/api/reactivity-core.html#computed) registrando qué propiedades reactivas se leen cada vez que se ejecuta el getter. Si la lógica condicional impide que se lea una propiedad en una evaluación dada, Vue no la rastrea como dependencia hasta que una reevaluación futura la lea.

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

Vue recoge las dependencias en cada evaluación, no solo en la primera. Cuando `isEnabled` es `false`, el return temprano hace que `data.value` nunca se lea, así que Vue no lo rastrea durante esa ejecución. Si `data` cambia mientras esa rama está activa, el computed no se reevalúa porque `data` no era una dependencia rastreada en la última ejecución. Solo volverá a detectar `data` cuando `isEnabled` cambie a `true` y provoque una reevaluación que lea `data.value`.

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

Ver también: [¿Cómo afecta la estabilidad de objetos en computed a los re-renders?](/es/q/perf-computed-object-stability) · [¿Por qué ordenar un array dentro de computed muta los datos originales?](/es/q/computed-sort-mutation)

## Referencias

- [computed() — Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [Caché de computed vs. métodos — Vue guide](https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods)
- [Buenas prácticas: computed — Vue guide](https://vuejs.org/guide/essentials/computed.html#best-practices)
