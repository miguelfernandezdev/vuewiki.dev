---
order: 23
title: '¿Qué es lifting state up y cuándo deberías hacerlo?'
difficulty: 'beginner'
tags: ['components', 'architecture', 'pinia', 'provide-inject']
summary: 'Mueve datos compartidos al ancestro común más cercano. Los hijos los reciben via props y comunican cambios via eventos. Evita estado duplicado y desincronizado.'
---

Lifting state up significa mover datos compartidos desde un componente hijo al ancestro común más cercano para que varios hijos puedan acceder al mismo state y mantenerse sincronizados.

## El problema

Dos componentes hermanos necesitan acceder a los mismos datos, pero cada uno gestiona su propia copia. Se dessincronizan.

```
App
├── TemperatureInput (Celsius)    ← tiene su propio state
└── TemperatureInput (Fahrenheit) ← tiene su propio state
```

Cada input sigue la temperatura de forma independiente. Escribir en uno no actualiza el otro.

## La solución: subir el state al padre

```vue
<!-- App.vue -->
<template>
  <TemperatureInput
    label="Celsius"
    :value="celsius"
    @update="celsius = $event"
  />
  <TemperatureInput
    label="Fahrenheit"
    :value="fahrenheit"
    @update="updateFromFahrenheit"
  />
</template>

<script setup>
import { ref, computed } from 'vue'

const celsius = ref(0)

const fahrenheit = computed(() => celsius.value * 9 / 5 + 32)

function updateFromFahrenheit(f: number) {
  celsius.value = (f - 32) * 5 / 9
}
</script>
```

```vue
<!-- TemperatureInput.vue -->
<script setup>
defineProps<{ label: string; value: number }>()
const emit = defineEmits<{ update: [value: number] }>()
</script>

<template>
  <label>
    {{ label }}
    <input
      type="number"
      :value="value"
      @input="emit('update', Number(($event.target as HTMLInputElement).value))"
    />
  </label>
</template>
```

Ahora el padre es la única fuente de verdad. Ambos inputs siempre muestran valores coherentes.

## Cuándo subir el state

| Situación                           | Acción                               |
| ----------------------------------- | ------------------------------------ |
| Solo un componente usa los datos    | Mantenlo local                       |
| Padre e hijo comparten datos        | Props hacia abajo, emit hacia arriba |
| Hermanos necesitan los mismos datos | Subir al ancestro común más cercano  |
| Componentes distantes por el árbol  | `provide`/`inject` o Pinia           |

## Cuándo se vuelve doloroso

Si estás pasando props a través de 3 o más niveles de componentes que no usan los datos ellos mismos ("prop drilling"), subir el state ya no es la herramienta adecuada. Cambia a:

- **`provide` / `inject`** para state compartido con ámbito de subárbol sin prop drilling.
- **Pinia** para state global o entre funcionalidades que necesitan muchos componentes no relacionados.

```
App                         App (con provide)
├── Layout                  ├── Layout
│   ├── Sidebar             │   ├── Sidebar
│   │   └── UserMenu ← necesita user    │   │   └── UserMenu ← inject('user')
│   └── Main                │   └── Main
│       └── Header ← necesita user      │       └── Header ← inject('user')
```

La regla: sube el state al ancestro común más cercano que haga que el flujo de datos sea simple y obvio. Si ese ancestro queda demasiado lejos, usa un mecanismo de compartición diferente.

Ver también: [¿Cómo funciona provide/inject?](/es/q/provide-inject) · [¿Cuál es la diferencia entre props y state?](/es/q/props-vs-state) · [¿Qué es el flujo de datos unidireccional?](/es/q/flux-unidirectional-data-flow)

## Referencias

- [Props](https://vuejs.org/guide/components/props.html) - Vue.js docs
- [Events](https://vuejs.org/guide/components/events.html) - Vue.js docs
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
