---
order: 11
title: "¿Cuál es la diferencia entre watch y watchEffect?"
difficulty: "intermediate"
tags: ["reactivity", "composition-api", "watchers"]
---

Ambos ejecutan código en respuesta a cambios reactivos, pero difieren en **cómo le dices a Vue qué observar** y **cuándo se ejecutan por primera vez**.

## watch: tú especificas qué observar

[`watch`](https://vuejs.org/api/reactivity-core.html#watch) toma una fuente explícita (un ref, un getter, o un array de fuentes) y solo se ejecuta cuando esa fuente específica cambia. Te proporciona tanto el valor antiguo como el nuevo.

```ts
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newVal, oldVal) => {
  console.log(`Cambió de ${oldVal} a ${newVal}`)
})

// Observar múltiples fuentes
const firstName = ref('Ana')
const lastName = ref('García')

watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log(`Nombre cambiado a ${newFirst} ${newLast}`)
})
```

`watch` es **lazy por defecto** — no se ejecuta hasta que la fuente cambia realmente. Añade `{ immediate: true }` si necesitas que se ejecute una vez de inmediato.

## watchEffect: Vue deduce las dependencias

[`watchEffect`](https://vuejs.org/api/reactivity-core.html#watcheffect) ejecuta tu callback de inmediato y rastrea automáticamente cada valor reactivo que lees dentro de él. Cuando cualquiera de esos valores cambia, vuelve a ejecutarse.

```ts
import { ref, watchEffect } from 'vue'

const query = ref('')
const page = ref(1)

watchEffect(async () => {
  // Vue ve que lees query.value y page.value
  // Se volverá a ejecutar cuando cualquiera de los dos cambie
  const results = await fetch(`/api/search?q=${query.value}&page=${page.value}`)
  // ...
})
```

No listas dependencias en ningún sitio — Vue las detecta en tiempo de ejecución observando qué valores reactivos lee realmente tu código.

## Cuándo usar cuál

**Usa `watch` cuando:**

- Necesitas el **valor anterior** (por ejemplo, comparar el antiguo con el nuevo para decidir qué hacer)
- Quieres observar algo **específico** e ignorar otros datos reactivos en el callback
- Quieres ejecución **lazy** (no ejecutar hasta el primer cambio)
- Necesitas `{ deep: true }` para observar cambios en objetos anidados

```ts
watch(route, (newRoute, oldRoute) => {
  if (newRoute.path !== oldRoute.path) {
    analytics.track('page_view', { path: newRoute.path })
  }
})
```

**Usa `watchEffect` cuando:**

- Tienes un **efecto secundario simple** que depende de datos reactivos y debe ejecutarse de inmediato
- No te importa el valor anterior
- Quieres que las dependencias se rastreen automáticamente (menos código, menos errores)

```ts
watchEffect(() => {
  document.title = `${count.value} elementos — MiApp`
})
```

## La advertencia del rastreo automático

`watchEffect` solo rastrea dependencias que se leen **síncronamente** durante la ejecución. Si lees un valor reactivo después de un `await`, Vue no lo rastreará:

```ts
watchEffect(async () => {
  // ✅ rastreado — leído antes del await
  const url = `/api/users?role=${role.value}`

  const data = await fetch(url)

  // ❌ NO rastreado — leído después del await
  console.log(filter.value)
})
```

Si te encuentras con esto, lee todos los valores reactivos antes del primer `await`, o cambia a `watch` con fuentes explícitas.

Ver también: [¿Cuál es la diferencia entre computed y watch?](/es/q/computed-vs-watch) · [¿Cómo agrupa Vue las actualizaciones del DOM?](/es/q/dom-update-batching)

## Referencias

- [watch()](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
- [watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
