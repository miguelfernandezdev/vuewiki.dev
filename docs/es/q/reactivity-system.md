---
order: 20
title: "¿Cómo funciona el sistema de reactividad de Vue 3?"
difficulty: "intermediate"
tags: ["reactivity"]
---

Vue 3 usa **[Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)** (en lugar del `Object.defineProperty` de Vue 2):

1. Al crear `reactive(obj)`, Vue envuelve el objeto en un Proxy
2. El Proxy intercepta `get` → registra qué efecto (computed/watch/render) accedió a qué propiedad (**track**)
3. El Proxy intercepta `set` → notifica a todos los efectos que dependen de esa propiedad (**trigger**)

```
reactive(obj)  →  Proxy  →  get: track(target, key)
                          →  set: trigger(target, key)
```

**`ref`** usa internamente un objeto con getter/setter en `.value` que realiza track/trigger. Si el valor es un objeto, lo envuelve en `reactive`.

**Implicaciones prácticas:**

- Desestructurar un `reactive` pierde la reactividad → usa `toRefs()`
- Reasignar un `reactive` pierde la referencia → usa `ref` para valores reemplazables
- [shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref) / `shallowReactive` no hace seguimiento profundo (mejor rendimiento)

Ver también: [¿Qué es el problema de identidad del proxy en reactividad?](/es/q/proxy-identity-hazard) · [¿Por qué pierdo reactividad al desestructurar un objeto reactive?](/es/q/reactive-destructuring-gotcha)

## Referencias

- [reactive() — Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Reactividad en profundidad — Vue guide](https://vuejs.org/guide/extras/reactivity-in-depth.html)
