---
order: 59
title: "¿Qué son los componentes dinámicos y cómo funciona KeepAlive?"
difficulty: "intermediate"
tags: ["components", "performance"]
---

Los componentes dinámicos permiten cambiar entre componentes en tiempo de ejecución usando el elemento integrado `<component>` con la prop `:is`. Por defecto, Vue destruye el componente antiguo y crea uno nuevo en cada cambio. `<KeepAlive>` altera ese comportamiento almacenando las instancias en memoria.

## Componentes dinámicos

```vue
<script setup>
import { ref, shallowRef } from 'vue'
import TabHome from './TabHome.vue'
import TabSettings from './TabSettings.vue'
import TabProfile from './TabProfile.vue'

const tabs = { TabHome, TabSettings, TabProfile }
const currentTab = shallowRef(TabHome)
</script>

<template>
  <button v-for="(comp, name) in tabs" :key="name" @click="currentTab = comp">
    {{ name }}
  </button>

  <!-- Se destruye y recrea en cada cambio -->
  <component :is="currentTab" />
</template>
```

Sin `KeepAlive`, cualquier estado local en `TabSettings` (inputs de formulario, posición de scroll, secciones expandidas) se reinicia cada vez que cambias de pestaña y vuelves.

## Añadir KeepAlive

Envuelve `<component>` en `<KeepAlive>` para almacenar las instancias en caché en lugar de destruirlas.

```vue
<template>
  <KeepAlive>
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

Ahora cambiar de pestaña conserva el estado completo de cada componente.

## Controlar qué se almacena en caché

Usa `include`, `exclude` y `max` para limitar el almacenamiento en caché.

```vue
<template>
  <!-- Solo almacenar estos dos en caché -->
  <KeepAlive include="TabHome,TabSettings">
    <component :is="currentTab" />
  </KeepAlive>

  <!-- Almacenar todo excepto este -->
  <KeepAlive exclude="TabProfile">
    <component :is="currentTab" />
  </KeepAlive>

  <!-- Almacenar en caché como máximo 5 instancias (expulsión LRU) -->
  <KeepAlive :max="5">
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

`include` y `exclude` comparan con el `name` del componente. Establécelo explícitamente con `defineOptions`:

```vue
<script setup>
defineOptions({ name: 'TabSettings' })
</script>
```

## Lifecycle hooks para componentes en caché

Los componentes en caché no disparan `onMounted`/`onUnmounted` al cambiar. Usa `onActivated` y `onDeactivated` en su lugar.

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  // El componente volvió a ser visible, refresca datos si es necesario
  refreshData()
})

onDeactivated(() => {
  // Componente oculto pero aún vivo, pausa el trabajo en segundo plano
  pausePolling()
})
</script>
```

Ciclo de vida completo de un componente en caché:

```
onMounted → onActivated → (el usuario cambia de pestaña) → onDeactivated
         → (el usuario vuelve) → onActivated → ...
         → (caché expulsado o padre destruido) → onUnmounted
```

## KeepAlive con Vue Router

```vue
<template>
  <router-view v-slot="{ Component, route }">
    <KeepAlive>
      <component :is="Component" :key="route.fullPath" />
    </KeepAlive>
  </router-view>
</template>
```

Usar `route.fullPath` como key significa que `/users/1` y `/users/2` se almacenan en caché por separado.

## Cuándo NO usar KeepAlive

| Escenario | Por qué |
|---|---|
| Componentes con mucha memoria (mapas, tablas grandes) | Las instancias en caché permanecen en memoria |
| Datos sensibles (formularios de autenticación, flujos de pago) | Los datos deben limpiarse al salir |
| Componentes con temporizadores en segundo plano que no puedes pausar | Siguen ejecutándose mientras están ocultos |
| Páginas donde los usuarios esperan resultados frescos | Los datos en caché desactualizados confunden a los usuarios |

Ver también: [¿Qué son los componentes asíncronos?](/es/q/async-components) · [¿Qué son Teleport, Fragments y Suspense?](/es/q/teleport-fragments-suspense) · [¿Cómo funciona el atributo `is`?](/es/q/is-attribute-dynamic-rendering)

## Referencias

- [Dynamic Components](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components) - Vue.js docs
- [KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html) - Vue.js docs
