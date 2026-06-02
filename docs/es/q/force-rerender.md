---
order: 46
title: "¿Cómo fuerzas el re-renderizado de un componente?"
difficulty: "intermediate"
tags: ["components", "reactivity"]
---

Cambia el atributo `key` del componente. Cuando la key cambia, Vue destruye la instancia antigua y crea una nueva desde cero, ejecutando todos los lifecycle hooks de nuevo y reiniciando todo el estado local. Este es el único enfoque limpio. Técnicas como `$forceUpdate` o incrementar un contador para disparar un re-render son casi siempre síntomas de una configuración de reactividad incorrecta.

## El enfoque con key

```vue
<template>
  <UserProfile :user="user" :key="user.id" />
</template>
```

Cuando `user.id` cambia, Vue desmonta el `UserProfile` antiguo y monta uno nuevo. Esto es útil cuando un componente tiene estado interno que necesita reiniciarse al cambiar la entidad subyacente (como cambiar entre perfiles de usuario que comparten la misma ruta).

Una versión más explícita cuando necesitas un disparador manual:

```vue
<script setup>
const componentKey = ref(0)

function forceRecreate() {
  componentKey.value++
}
</script>

<template>
  <ExpensiveComponent :key="componentKey" />
  <button @click="forceRecreate">Reset</button>
</template>
```

## Por qué rara vez lo necesitas

Si sientes la necesidad de forzar un re-render, el estado reactivo probablemente no está configurado correctamente. Los primitivos [ref](https://vuejs.org/api/reactivity-core.html#ref) y [reactive](https://vuejs.org/api/reactivity-core.html#reactive) deberían gestionar la mayoría de los casos automáticamente. Causas habituales:

**Mutar un array u objeto sin que Vue lo rastree:**

```ts
// MAL: Vue no puede ver esto
items[0] = newItem

// BIEN: Vue rastrea esto
items.value[0] = newItem  // con ref
items[0] = newItem        // con reactive (el Proxy lo captura)
```

**Leer un valor no reactivo en el template:**

```ts
// MAL: variable plana, sin reactividad
let count = 0

// BIEN: ref reactivo
const count = ref(0)
```

**Esperar que un computed se actualice cuando sus dependencias no han cambiado:**

```ts
// Esto solo se reevalúa cuando items.value cambia
const total = computed(() =>
  items.value.reduce((sum, i) => sum + i.price, 0)
)
```

Corrige la reactividad y Vue actualizará el DOM automáticamente. Esa es la esencia del sistema.

## $forceUpdate (Options API)

En la Options API, `this.$forceUpdate()` dispara un re-render del componente sin destruirlo. El estado local y los componentes hijo se conservan:

```ts
// Solo en Options API
export default {
  methods: {
    refresh() {
      this.$forceUpdate()
    }
  }
}
```

No existe un equivalente de `$forceUpdate` en la Composition API porque la premisa es que, si tu estado reactivo es correcto, nunca lo necesitarás. Si estás en `<script setup>` y crees que necesitas una actualización forzada, revisa la configuración de tu reactividad.

## Cuándo el re-render basado en key es legítimo

| Escenario | Por qué funciona la key |
|---|---|
| Cambiar entre entidades en la misma ruta (`/users/1` → `/users/2`) | Reinicia el estado local (valores del formulario, posición de scroll) para la nueva entidad |
| Componente de terceros con estado interno que no puedes controlar | Fuerza la inicialización limpia |
| Tras un cambio de locale/tema que requiere reinicialización completa | Algunas librerías de i18n necesitan que los componentes se remonten |
| Restablecer un formulario a su estado inicial | Más sencillo que reiniciar manualmente cada campo |

## Key change vs actualización reactiva

| | Cambio de key | Actualización reactiva |
|---|---|---|
| Lifecycle hooks | Todos se ejecutan de nuevo (`onMounted`, etc.) | Ninguno se ejecuta |
| Estado local | Se reinicia a los valores iniciales | Se conserva |
| Componentes hijo | Se destruyen y recrean | Se parchean in situ |
| DOM | Se reemplaza completamente | Se parchea mínimamente |
| Rendimiento | Costoso (desmontaje completo + setup) | Barato (actualizaciones dirigidas) |

Usa actualizaciones reactivas por defecto. Reserva el re-render basado en key para casos donde genuinamente necesites una instancia fresca del componente.

Ver también: [¿Cómo funciona el sistema de reactividad de Vue 3?](/es/q/reactivity-system) · [¿Rompe la reactividad reasignar una propiedad en un objeto reactive?](/es/q/reactive-property-reassignment)

## Referencias

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Atributos especiales: key — Vue docs](https://vuejs.org/api/built-in-special-attributes.html#key)
- [Fundamentos de reactividad — Vue guide](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
