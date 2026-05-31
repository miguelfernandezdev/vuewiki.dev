---
order: 21
title: "¿Cómo planificarías una migración de Vue 2 a Vue 3?"
difficulty: "advanced"
tags: ["migration"]
---

1. **Auditoría:** Inventario de componentes, mixins, filtros, plugins y dependencias
2. **Build de compatibilidad:** Vue 3 tiene un modo `@vue/compat` que emula Vue 2 y muestra advertencias
3. **Migración incremental:**
   - Primero: actualizar el tooling de build (Webpack → Vite)
   - Segundo: eliminar las APIs obsoletas (filtros, event bus `$on/$off`, `$listeners`)
   - Tercero: migrar Options API → Composition API componente a componente
   - Cuarto: mixins → composables
   - Quinto: Vuex → Pinia (o Vuex 4 como paso intermedio)
4. **Tests en cada paso:** Los tests existentes deben seguir pasando
5. **Zonas de riesgo:** Librerías de terceros, directivas personalizadas, render functions, plugins

El build de compatibilidad permite hacerlo de forma incremental. La clave es no intentar migrar todo a la vez — componente a componente, con tests en cada paso.
