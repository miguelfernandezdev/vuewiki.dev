---
order: 74
title: "¿Qué es effectScope y cuándo lo usarías?"
difficulty: "advanced"
tags: ["reactivity", "composables"]
---

`effectScope` crea un contenedor que recolecta todos los efectos reactivos (watchers, computed, watchEffect) creados dentro de él. Cuando llamas a `scope.stop()`, todos los efectos del scope se eliminan a la vez. Esto es lo que Vue hace internamente para cada instancia de componente, pero puedes usarlo tú mismo en composables o contextos fuera de componentes.

## Uso básico

```ts
import { effectScope, ref, watch, computed } from 'vue'

const scope = effectScope()

scope.run(() => {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)

  watch(count, (val) => {
    console.log('count changed:', val)
  })
})

// Más tarde: elimina todo lo creado dentro
scope.stop()
// El watch y el computed ahora están limpios
```

## Por qué lo necesitas

Dentro de un componente, Vue detiene automáticamente todos los efectos cuando el componente se desmonta. Pero en dos escenarios no tienes esa red de seguridad:

**1. Composables que crean muchos efectos.** Sin `effectScope`, tendrías que rastrear y detener cada uno manualmente:

```ts
// Sin effectScope: limpieza manual tediosa
function useFeature() {
  const stop1 = watch(source1, handler1)
  const stop2 = watch(source2, handler2)
  const stop3 = watchEffect(handler3)

  function cleanup() {
    stop1()
    stop2()
    stop3()
  }

  return { cleanup }
}
```

```ts
// Con effectScope: un stop limpia todo
function useFeature() {
  const scope = effectScope()

  scope.run(() => {
    watch(source1, handler1)
    watch(source2, handler2)
    watchEffect(handler3)
  })

  function cleanup() {
    scope.stop()
  }

  return { cleanup }
}
```

**2. Lógica reactiva fuera de componentes.** Stores, capas de servicio o configuraciones de tests que crean efectos pero no tienen un lifecycle de componente para limpiarlos:

```ts
// Store global con su propio scope
const scope = effectScope()

const store = scope.run(() => {
  const items = ref<Item[]>([])
  const total = computed(() => items.value.length)

  watchEffect(() => {
    localStorage.setItem('items', JSON.stringify(items.value))
  })

  return { items, total }
})!

// Cuando el store ya no se necesita
scope.stop()
```

## getCurrentScope y onScopeDispose

`getCurrentScope` devuelve el scope activo (útil para código de librerías). `onScopeDispose` registra un callback de limpieza en el scope actual, similar a `onUnmounted` pero para cualquier scope, no solo componentes:

```ts
import { getCurrentScope, onScopeDispose } from 'vue'

function useEventListener(target: EventTarget, event: string, handler: EventListener) {
  target.addEventListener(event, handler)

  if (getCurrentScope()) {
    onScopeDispose(() => {
      target.removeEventListener(event, handler)
    })
  }
}
```

Este composable limpia el listener cuando el scope se detiene, ya sea que ese scope pertenezca a un componente o a un `effectScope` que creaste tú mismo.

## Scopes desvinculados

Por defecto, un scope creado dentro de otro scope es un hijo y se detendrá cuando el padre se detenga. Pasa `true` para crear un scope desvinculado que debe detenerse de forma independiente:

```ts
const parentScope = effectScope()

parentScope.run(() => {
  const childScope = effectScope(true) // desvinculado
  childScope.run(() => {
    // Esto sobrevive a parentScope.stop()
  })
})

parentScope.stop() // childScope NO se detiene
```

## Cuándo usar effectScope

| Escenario | ¿Usar effectScope? |
|---|---|
| Lógica normal de componente | No, Vue lo gestiona |
| Composable con muchos watchers/computed | Sí, simplifica la limpieza |
| Store tipo Pinia fuera de componentes | Sí, controla el tiempo de vida de los efectos |
| Configuración de tests con estado reactivo | Sí, limpia en afterEach |
| Watcher único que puedes detener manualmente | No, es excesivo |
