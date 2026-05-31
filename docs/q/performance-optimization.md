---
order: 24
title: "How would you optimize performance in a Vue app?"
difficulty: "advanced"
tags: ["performance"]
---

1. **Lazy loading routes:** `() => import('./views/Heavy.vue')`
2. **`v-once`** for static content that never changes
3. **`v-memo`** to prevent re-renders of sublists
4. **`shallowRef`** for large non-edited data
5. **`computed`** instead of methods (caching)
6. **Virtual scrolling** for long lists (vue-virtual-scroller)
7. **Code splitting** with `defineAsyncComponent`
8. **Debounce** on search/filter inputs
9. **`v-show`** instead of `v-if` for frequent toggles
10. **Avoid unnecessary watchers** — prefer computed when possible

**Diagnosing:**
- Vue DevTools → Performance timeline
- Browser DevTools → Performance tab → flame chart
- `vite-bundle-visualizer` to analyze bundle size
- Network tab for redundant API calls
