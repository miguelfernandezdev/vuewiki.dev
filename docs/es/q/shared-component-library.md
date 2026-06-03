---
order: 49
title: '¿Cómo diseñarías una librería de componentes compartida?'
difficulty: 'advanced'
tags: ['components', 'architecture', 'vite', 'vitest', 'slots']
summary: 'Cada componente es autónomo con props tipados, emits y slots. Publica como paquete con exports tree-shakeable y temas via variables CSS.'
---

Una librería de componentes compartida da a múltiples apps (o equipos) un conjunto consistente de componentes UI. El objetivo es reutilización sin acoplamiento. Cada consumidor importa lo que necesita, obtiene type safety y theming, y puede actualizar a su propio ritmo.

## Estructura del proyecto

La librería vive en su propio paquete, ya sea un repo independiente o un workspace dentro de un monorepo. Cada componente es una unidad autocontenida con props tipadas, emits tipados, y slots para flexibilidad:

```text
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.vue
│   │   │   └── index.ts
│   │   ├── Input/
│   │   └── Modal/
│   ├── tokens/
│   │   └── colors.css
│   └── index.ts          ← named exports para tree-shaking
├── package.json
└── vite.config.ts         ← build en modo librería
```

## Principios de diseño de componentes

**Tipa todo.** Cada componente debería tener props tipadas, emits tipados y slots tipados. Los consumidores obtienen autocompletado y errores en tiempo de compilación:

```vue
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md'
})

defineEmits<{
  click: [event: MouseEvent]
}>()

defineSlots<{
  default: () => void
  icon?: () => void
}>()
</script>
```

**Usa slots en lugar de props para contenido.** Un botón que recibe props `label` e `icon` es limitado. Un botón con un slot por defecto y un slot `icon` permite a los consumidores poner cualquier cosa dentro: texto, iconos, badges, markup complejo.

**Usa CSS custom properties para theming.** No hardcodees colores ni espaciado. Expón design tokens que los consumidores puedan sobreescribir:

```css
.btn {
  background: var(--ui-color-primary, #3b82f6);
  padding: var(--ui-spacing-md, 0.75rem 1.5rem);
  border-radius: var(--ui-radius, 0.375rem);
}
```

Los consumidores sobreescriben tokens a nivel de app sin tocar el código de la librería.

## Build y distribución

Usa el [modo librería de Vite](https://vite.dev/guide/build.html#library-mode) para hacer build. Exporta componentes con nombre para tree-shaking, de forma que los consumidores solo empaquetan lo que importan:

```ts
// src/index.ts
export { default as Button } from './components/Button/Button.vue'
export { default as Input } from './components/Input/Input.vue'
export { default as Modal } from './components/Modal/Modal.vue'
```

Establece `sideEffects: false` en `package.json` para que los bundlers puedan eliminar componentes no usados.

## Documentación

Usa [VitePress](https://vitepress.dev/) o [Storybook](https://storybook.js.org/) para docs interactivos. Cada componente debería tener ejemplos en vivo mostrando variantes, tamaños, slots y edge cases. Storybook es más completo para desarrollo de componentes (testing visual, checks de accesibilidad); VitePress es más ligero si tus docs también cubren guías de uso y referencia de API.

## Versionado y testing

- **Semver**: cambios breaking en props son bumps major, nuevos componentes son minor
- **Vitest** para tests unitarios (renderizado de props, comportamiento de emits, contenido de slots)
- **Regresión visual** (Chromatic, Percy, o screenshots de Playwright) para detectar cambios de estilo no intencionados

Ver también: [¿Cómo se declaran props con TypeScript?](/es/q/props-with-typescript) · [¿Qué son los slots?](/es/q/slots) · [¿Qué son los atributos fallthrough?](/es/q/fallthrough-attrs)

## Referencias

- [Library Mode](https://vite.dev/guide/build.html#library-mode) - Vite docs
- [Storybook for Vue](https://storybook.js.org/docs/get-started/frameworks/vue3-vite) - Storybook docs
- [VitePress](https://vitepress.dev/) - VitePress docs
