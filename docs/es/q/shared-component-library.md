---
order: 23
title: "¿Cómo diseñarías una librería de componentes compartida?"
difficulty: "advanced"
tags: ["components", "architecture"]
---

1. **Paquete separado** (monorepo o repositorio independiente)
2. **Cada componente:** Props tipadas, emits tipados, slots para flexibilidad
3. **Documentación:** VitePress o Storybook con ejemplos interactivos
4. **Design tokens:** Custom properties de CSS para theming (`--color-primary`, etc.)
5. **Testing:** Vitest para tests unitarios + tests de regresión visual
6. **Versionado:** Semver para que cada equipo pueda actualizar a su ritmo
7. **Tree-shaking:** Named exports para que solo se incluya lo que se usa
8. **Accesibilidad:** ARIA, navegación por teclado, gestión del foco

```ts
// Buen componente de librería
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false
})

defineEmits<{ click: [event: MouseEvent] }>()
</script>
```
