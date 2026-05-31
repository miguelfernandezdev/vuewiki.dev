---
order: 22
title: "¿Cuándo usarías shallowRef / shallowReactive?"
difficulty: "advanced"
tags: ["reactivity", "performance"]
---

Cuando tienes objetos grandes que no necesitan reactividad profunda:

```ts
// ❌ Reactividad profunda en un array de 10.000 elementos = lento
const items = ref<Item[]>(hugeArray)

// ✅ Shallow: solo reacciona si reasignas el ref, no si cambias un elemento
const items = shallowRef<Item[]>(hugeArray)

// Para actualizar, hay que reasignar:
items.value = [...items.value, newItem]
// O forzar el trigger:
triggerRef(items)
```

**Casos de uso:** Listas grandes, datos de API que no se editan directamente, objetos de configuración complejos.
