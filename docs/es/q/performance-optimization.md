---
order: 24
title: "¿Cómo optimizarías el rendimiento de una app Vue?"
difficulty: "advanced"
tags: ["performance"]
---

1. **Lazy loading de rutas:** `() => import('./views/Heavy.vue')`
2. **`v-once`** para contenido estático que nunca cambia
3. **`v-memo`** para evitar re-renders en sublistas
4. **`shallowRef`** para datos grandes que no se editan
5. **`computed`** en lugar de métodos (caché)
6. **Virtual scrolling** para listas largas (vue-virtual-scroller)
7. **Code splitting** con `defineAsyncComponent`
8. **Debounce** en inputs de búsqueda y filtros
9. **`v-show`** en lugar de `v-if` para elementos que se ocultan y muestran con frecuencia
10. **Evitar watchers innecesarios** — preferir computed cuando sea posible

**Diagnóstico:**
- Vue DevTools → Performance timeline
- Browser DevTools → pestaña Performance → flame chart
- `vite-bundle-visualizer` para analizar el tamaño del bundle
- Pestaña Network para detectar llamadas a la API redundantes
