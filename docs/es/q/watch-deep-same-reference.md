---
order: 71
title: '¿Por qué mi watcher recibe el mismo valor para old y new?'
difficulty: 'intermediate'
tags: ['reactivity', 'errors', 'watchers']
summary: 'Deep-watch de un objeto reactive da la misma referencia para old y new. Vue no clona antes de mutar. Usa structuredClone si necesitas el diff.'
---

Porque cuando observas en profundidad un objeto reactivo con [watch](https://vuejs.org/api/reactivity-core.html#watch) y mutas una propiedad anidada, tanto `newValue` como `oldValue` apuntan a la **misma referencia de objeto**. Vue no clona el objeto antes de la mutación, por lo que cuando se ejecuta el callback, ambas referencias reflejan el estado actual (mutado).

```ts
const state = reactive({
  user: { name: 'John', theme: 'dark' }
})

watch(
  () => state.user,
  (newUser, oldUser) => {
    console.log(newUser === oldUser) // true, mismo objeto
    console.log(oldUser.name) // 'Jane', no 'John'
  },
  { deep: true }
)

state.user.name = 'Jane'
```

Tanto `newUser` como `oldUser` son `{ name: 'Jane', theme: 'dark' }`. No puedes compararlos.

## Cómo solucionarlo

**Opción 1:** Observa la propiedad específica que te interesa. Los primitivos se copian, por lo que old/new funcionan correctamente.

```ts
watch(
  () => state.user.name,
  (newName, oldName) => {
    console.log(`${oldName} → ${newName}`) // 'John → Jane'
  }
)
```

**Opción 2:** Observa varias propiedades específicas.

```ts
watch(
  [() => state.user.name, () => state.user.theme],
  ([newName, newTheme], [oldName, oldTheme]) => {
    if (newName !== oldName) console.log('name changed')
    if (newTheme !== oldTheme) console.log('theme changed')
  }
)
```

**Opción 3:** Devuelve un clon superficial desde el getter para que Vue capture una instantánea.

```ts
watch(
  () => ({ ...state.user }),
  (newUser, oldUser) => {
    // ahora son objetos distintos
    console.log(oldUser.name, '→', newUser.name)
  },
  { deep: true }
)
```

## Cuándo old y new SÍ difieren

Difieren cuando el objeto entero se **reemplaza**, no cuando se muta:

```ts
state.user = { name: 'Jane', theme: 'light' } // reemplazo → referencias distintas
state.user.name = 'Jane' // mutación → misma referencia
```

Ver también: [¿Cuál es la diferencia entre watch y watchEffect?](/es/q/watch-vs-watcheffect) · [¿Qué es el problema de identidad del proxy reactivo?](/es/q/proxy-identity-hazard)

## Referencias

- [watch() - Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [Watchers guide - Vue docs](https://vuejs.org/guide/essentials/watchers.html)
- [reactive() - Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
