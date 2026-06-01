---
order: 167
title: "¿Qué son los componentes funcionales y cuándo son útiles?"
difficulty: "intermediate"
tags: ["components", "performance"]
---

Los componentes funcionales son componentes definidos como funciones planas que reciben props y devuelven VNodes. No tienen instancia, ni estado reactivo, ni lifecycle hooks, ni contexto `this`. En Vue 2, ofrecían una ventaja de rendimiento considerable porque omitían la sobrecarga de creación de la instancia del componente. En Vue 3, los componentes con estado ya son tan rápidos que la diferencia de rendimiento es mínima. Los componentes funcionales siguen existiendo, pero su uso principal ahora son los patrones de renderizado programático, no la optimización.

## Sintaxis en Vue 3

```ts
import { h } from 'vue'
import type { FunctionalComponent } from 'vue'

interface BadgeProps {
  label: string
  color?: 'green' | 'red' | 'blue'
}

const Badge: FunctionalComponent<BadgeProps> = (props, { slots }) => {
  return h('span', {
    class: `badge badge-${props.color ?? 'blue'}`
  }, props.label)
}

Badge.props = {
  label: { type: String, required: true },
  color: { type: String, default: 'blue' }
}
```

La función recibe `props` como primer argumento y un objeto de contexto con `slots`, `emit` y `attrs` como segundo.

## Uso con JSX/TSX

Los componentes funcionales se sienten más naturales con JSX:

```tsx
const Badge: FunctionalComponent<BadgeProps> = (props) => (
  <span class={`badge badge-${props.color ?? 'blue'}`}>
    {props.label}
  </span>
)
```

## Qué no pueden hacer

| Característica | Componente SFC | Componente funcional |
|---|---|---|
| Estado reactivo (`ref`, `reactive`) | Sí | No |
| Lifecycle hooks | Sí | No |
| `watch` / `computed` | Sí | No |
| Sintaxis de template | Sí | No (solo render function) |
| `<style scoped>` | Sí | No |
| Instancia del componente (`this`) | Sí | No |
| Slots | Sí | Sí |
| Validación de props | Sí | Sí |
| Emitir eventos | Sí | Sí |

## Cuándo son realmente útiles

### 1. Componentes wrapper finos

Componentes que simplemente pasan o transforman props para otro componente:

```ts
const PrimaryButton: FunctionalComponent<ButtonProps> = (props, { slots }) => {
  return h(BaseButton, { ...props, variant: 'primary' }, slots)
}
```

### 2. Lógica basada en render (helpers de renderizado condicional)

```ts
const Show: FunctionalComponent<{ when: boolean }> = (props, { slots }) => {
  return props.when ? slots.default?.() : null
}
```

### 3. Patrones de orden superior en librerías

Las librerías que generan componentes programáticamente se benefician de la firma ligera de función frente al setup completo de un SFC.

## Componentes funcionales en Vue 2 vs Vue 3

En Vue 2, los componentes funcionales se marcaban con `functional: true` en los SFCs o en las opciones del componente, y tenían una ventaja de rendimiento significativa porque la creación de instancias de Vue 2 era costosa.

Vue 3 optimizó los componentes con estado de tal manera (creación de instancias más rápida, optimizaciones del compilador, reactividad basada en Proxy) que la diferencia de sobrecarga es mínima. El equipo de Vue recomienda usar SFCs estándar con `<script setup>` para todo, a menos que tengas una razón específica para usar una render function.

## ¿Deberías usarlos?

Para código de aplicación, casi nunca. Un SFC estándar con `<script setup>` es más legible, admite estilos con scope, tiene mejor soporte de herramientas y la diferencia de rendimiento no justifica el tradeoff. Usa componentes funcionales cuando estés construyendo una librería que necesita generación programática de componentes, o cuando un componente genuinamente no tiene estado y una render function es más clara que un template.
