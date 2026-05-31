---
order: 21
title: "How would you plan a Vue 2 to Vue 3 migration?"
difficulty: "advanced"
---

1. **Audit:** Inventory of components, mixins, filters, plugins, dependencies
2. **Compatibility build:** Vue 3 has a `@vue/compat` mode that emulates Vue 2 and shows warnings
3. **Incremental migration:**
   - First: update build tooling (Webpack → Vite)
   - Second: remove deprecated APIs (filters, event bus `$on/$off`, `$listeners`)
   - Third: migrate Options API → Composition API component by component
   - Fourth: mixins → composables
   - Fifth: Vuex → Pinia (or Vuex 4 as intermediate step)
4. **Testing at each step:** Existing tests should keep passing
5. **Risk areas:** Third-party libraries, custom directives, render functions, plugins

The compatibility build makes it possible to do it incrementally. The key is not trying to migrate everything at once — component by component, with tests at each step.
