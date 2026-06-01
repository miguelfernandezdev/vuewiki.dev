---
order: 160
title: "¿Cómo funcionan los Maps y Sets reactivos en Vue 3?"
difficulty: "advanced"
tags: ["reactivity"]
---

`reactive()` de Vue 3 soporta `Map`, `Set`, `WeakMap` y `WeakSet` de serie. El Proxy intercepta los métodos de colección como `get`, `set`, `add`, `delete`, `has` y `forEach`, registrando las lecturas y disparando actualizaciones en las escrituras. Se usa la API estándar de JavaScript y Vue gestiona la reactividad de forma transparente. La limitación principal es que no se puede usar `ref()` con ellos, solo `reactive()`.

## Uso básico

```vue
<script setup>
const tags = reactive(new Set<string>())
const scores = reactive(new Map<string, number>())

function addTag(tag: string) {
  tags.add(tag)
}

function setScore(name: string, score: number) {
  scores.set(name, score)
}
</script>

<template>
  <div>
    <button @click="addTag('vue')">Add tag</button>
    <span v-for="tag in tags" :key="tag">{{ tag }}</span>
  </div>

  <div>
    <button @click="setScore('Alice', 95)">Set score</button>
    <div v-for="[name, score] in scores" :key="name">
      {{ name }}: {{ score }}
    </div>
  </div>
</template>
```

`v-for` funciona directamente con `Map` y `Set` porque Vue los itera igual que arrays. En un `Map`, cada entrada se desestructura como `[key, value]`.

## Qué métodos se registran

Vue intercepta estas operaciones:

| Operación | Registrada (lectura) | Dispara actualización (escritura) |
|---|---|---|
| `map.get(key)` | Sí | No |
| `map.set(key, value)` | No | Sí |
| `map.has(key)` | Sí | No |
| `map.delete(key)` | No | Sí |
| `map.size` | Sí | No |
| `map.forEach(fn)` | Sí (todas las entradas) | No |
| `set.add(value)` | No | Sí |
| `set.has(value)` | Sí | No |
| `set.delete(value)` | No | Sí |
| `map.clear()` | No | Sí |
| Iteración (`for...of`, spread) | Sí (todas las entradas) | No |

Esto significa que las propiedades computed y los watchers que leen de un Map o Set reactivo se volverán a ejecutar cuando se modifique la colección.

## ref() no funciona, usar reactive()

```ts
// MAL: ref envuelve el Map en { value: Map }, no hace proxy de los métodos del Map
const map = ref(new Map())
map.value.set('key', 'val') // Vue no lo registrará correctamente

// BIEN: reactive hace proxy del Map directamente
const map = reactive(new Map())
map.set('key', 'val') // completamente reactivo
```

Si se necesita reemplazar toda la colección (por ejemplo, al obtener datos frescos de una API), envolver en `shallowRef` y reemplazar `.value` con un nuevo Map/Set:

```ts
const scores = shallowRef(new Map<string, number>())

async function refresh() {
  const data = await $fetch('/api/scores')
  const newMap = new Map(data.map(d => [d.name, d.score]))
  scores.value = newMap // dispara la actualización
}
```

## Propiedades computed sobre Maps

```vue
<script setup>
const permissions = reactive(new Map<string, boolean>([
  ['read', true],
  ['write', false],
  ['admin', false]
]))

const activePermissions = computed(() =>
  [...permissions.entries()]
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
)
</script>

<template>
  <p>Active: {{ activePermissions.join(', ') }}</p>
  <button @click="permissions.set('write', true)">Grant write</button>
</template>
```

El `computed` se re-evalúa cuando cambia cualquier entrada del Map porque al hacer spread del Map se llama a su iterador, que Vue registra.

## Cuándo usar Map/Set frente a objetos planos y arrays

| Usar un Map cuando | Usar un objeto plano cuando |
|---|---|
| Las claves no son strings (objetos, números, símbolos) | Las claves son solo strings |
| Se necesita iteración garantizada en orden de inserción | El orden no importa |
| Se añaden/eliminan claves frecuentemente (los Maps están optimizados para esto) | La forma es estática |
| Se necesita `.size` sin `Object.keys().length` | El rendimiento no es una preocupación |

| Usar un Set cuando | Usar un array cuando |
|---|---|
| Se necesita unicidad garantizada automáticamente | Los duplicados son válidos |
| Se comprueba la pertenencia a menudo (`has()` es O(1)) | Se busca por índice |
| Se necesitan operaciones de unión/intersección/diferencia | Se necesita `map`/`filter`/`reduce` |

## Limitaciones

1. **Sin reactividad profunda para los valores**: si se almacena un objeto plano como valor de un Map, ese objeto NO se convierte automáticamente en reactivo. Habría que envolverlo con `reactive()` antes de almacenarlo.

2. **WeakMap/WeakSet son limitados**: funcionan con `reactive()` pero no se pueden iterar ni comprobar `.size`, lo que limita su utilidad en templates. Son útiles principalmente para bookkeeping interno en composables.

3. **Observar claves específicas**: `watch` sobre un Map reactivo observa toda la colección. Para observar una clave específica, usar un getter:

```ts
const config = reactive(new Map<string, string>())

watch(
  () => config.get('theme'),
  (newTheme) => {
    document.documentElement.className = newTheme ?? ''
  }
)
```
