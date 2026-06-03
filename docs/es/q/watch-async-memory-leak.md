---
order: 80
title: "¿Por qué los watchers creados dentro de callbacks asíncronos causan pérdidas de memoria?"
difficulty: "advanced"
tags: ["reactivity", "errors", "watchers"]
summary: "Watchers creados dentro de callbacks async (setTimeout, await) no están ligados al ciclo de vida. Siguen ejecutándose tras unmount. Detenlos manualmente."
---

Porque Vue solo limpia automáticamente los watchers creados de forma **síncrona** durante `setup()`. Cuando creas un [watch](https://vuejs.org/api/reactivity-core.html#watch) o [watchEffect](https://vuejs.org/api/reactivity-core.html#watcheffect) dentro de un `setTimeout`, `Promise.then` o después de un `await`, Vue no puede vincularlo al ciclo de vida del componente. Sigue ejecutándose después de que el componente se desmonte.

```ts
onMounted(async () => {
  await loadInitialData()

  // Este watcher NO está vinculado al componente
  watch(data, (newVal) => {
    processData(newVal) // sigue ejecutándose tras el desmontaje
  })
})
```

El mismo problema con `setTimeout`:

```ts
onMounted(() => {
  setTimeout(() => {
    watchEffect(() => {
      console.log(data.value) // sigue ejecutándose tras el desmontaje
    })
  }, 1000)
})
```

## Cómo solucionarlo

**Opción 1 (preferida):** Crea el watcher de forma síncrona con lógica condicional dentro.

```ts
const config = ref(null)
const userData = ref(null)

// Creado de forma síncrona, limpiado automáticamente al desmontar
watch(userData, (newData) => {
  if (config.value && newData) {
    applySettings(config.value, newData)
  }
})

onMounted(async () => {
  config.value = await fetchConfig()
})
```

**Opción 2:** Guarda la función de parada y llámala manualmente al desmontar.

```ts
let stopWatcher: (() => void) | null = null

onMounted(async () => {
  await loadData()

  stopWatcher = watch(data, (newVal) => {
    processData(newVal)
  })
})

onUnmounted(() => {
  stopWatcher?.()
})
```

La primera opción es casi siempre mejor. Si puedes reestructurar la lógica para que el watcher se cree de forma síncrona y la condición asíncrona se compruebe dentro del callback, evitas por completo la limpieza manual.

Ver también: [¿Por qué mi watchEffect pierde dependencias después de un await?](/es/q/watcheffect-async-tracking) · [¿Qué es effectScope y cuándo lo usarías?](/es/q/effect-scope)

## Referencias

- [watch() - Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [watchEffect() - Vue docs](https://vuejs.org/api/reactivity-core.html#watcheffect)
- [Composables guide - Vue docs](https://vuejs.org/guide/reusability/composables.html)
