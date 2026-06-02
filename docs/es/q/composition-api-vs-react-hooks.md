---
order: 85
title: "¿Cuál es la diferencia entre la Composition API y los React Hooks?"
difficulty: "advanced"
tags: ["composition-api"]
---

A primera vista se parecen (ambos extraen lógica reutilizable en funciones), pero tienen una diferencia fundamental: el `setup` de Vue se ejecuta **una vez** por instancia de componente, mientras que la función de componente de React se ejecuta en **cada renderizado**. Esta única diferencia elimina categorías enteras de bugs y patrones innecesarios.

## setup se ejecuta una vez

```vue
<script setup>
import { ref, watchEffect } from 'vue'

// Este código se ejecuta UNA VEZ cuando se crea el componente
const count = ref(0)
console.log('setup') // se registra una vez

watchEffect(() => {
  // Esto se ejecuta cuando cambian las dependencias, no en cada renderizado
  console.log(count.value)
})
</script>
```

En React, la función de componente equivalente se vuelve a ejecutar en cada cambio de estado, cada cambio de prop, cada re-renderizado del padre. Eso crea problemas que Vue no tiene.

## Sin closures obsoletas

En React, las funciones capturan el valor del estado en el momento del renderizado. Si un `setTimeout` se ejecuta más tarde, ve un valor antiguo ("stale closure"). En Vue, `ref.value` siempre lee el valor actual:

```ts
// Vue: siempre el valor actual
const count = ref(0)

onMounted(() => {
  setInterval(() => {
    console.log(count.value) // siempre el último valor
  }, 1000)
})
```

```tsx
// React: problema de closure obsoleta
const [count, setCount] = useState(0)

useEffect(() => {
  setInterval(() => {
    console.log(count) // captura el valor del renderizado cuando se ejecutó useEffect
  }, 1000)
}, []) // dependencia que falta, siempre registra 0
```

## Sin arrays de dependencias

Vue rastrea las dependencias reactivas automáticamente. No necesitas listarlas:

```ts
// Vue: rastreo automático
watchEffect(() => {
  fetchResults(query.value, filter.value)
  // Vue sabe que esto depende de query y filter
})

// React: array de dependencias manual
useEffect(() => {
  fetchResults(query, filter)
}, [query, filter]) // olvidar uno → datos obsoletos, añadir uno incorrecto → bucle infinito
```

## Sin useCallback ni useMemo

React recrea las funciones en cada renderizado, así que las envuelves en `useCallback` para evitar re-renderizados de los hijos. Las funciones de Vue se crean una vez en `setup` y nunca se recrean:

```ts
// Vue: simplemente define la función
function handleClick() {
  count.value++
}
// pásala a los hijos sin necesidad de envoltura

// React: necesita memoización
const handleClick = useCallback(() => {
  setCount(c => c + 1)
}, [])
```

Lo mismo para los cálculos costosos. El `computed` de Vue rastrea dependencias y cachea automáticamente. React necesita `useMemo` con un array de dependencias.

## Los composables pueden ser condicionales

Los React Hooks deben llamarse en el mismo orden en cada renderizado (sin condicionales, sin bucles, sin returns tempranos antes de los hooks). Los composables de Vue no tienen esa restricción porque `setup` se ejecuta una vez:

```ts
// Vue: perfectamente válido
if (featureEnabled) {
  const { data } = useSomeFeature()
}

// React: "Los Hooks no pueden llamarse condicionalmente"
```

## Comparativa

| Aspecto | Composition API de Vue | React Hooks |
|---|---|---|
| Ejecución | `setup` se ejecuta una vez | La función de componente se ejecuta en cada renderizado |
| Closures obsoletas | No posibles (ref.value siempre es actual) | Bug habitual, requiere soluciones alternativas |
| Rastreo de dependencias | Automático | Arrays manuales, reglas de lint |
| Memoización de funciones | No necesaria | `useCallback` requerido para rendimiento |
| Memoización de valores | `computed()` con rastreo automático | `useMemo` con array de dependencias |
| Uso condicional | Permitido | Prohibido (reglas de hooks) |
| Alcance del re-renderizado | Granular (solo lo que cambió) | Árbol de componentes completo por defecto |

## Patrones de React que hay que evitar en Vue

Si vienes de React, abandona estos hábitos:

- No envuelvas funciones en computed para "memoizarlas". Define la función directamente.
- No crees arrays de dependencias explícitos para `watchEffect`. Rastrea automáticamente.
- No te preocupes por la obsolescencia de las closures. `ref.value` siempre es actual.
- No añadas optimizaciones al estilo `React.memo`. La reactividad de Vue ya es granular.

Ver también: [¿Qué es la Composition API y en qué se diferencia de la Options API?](/es/q/composition-api-vs-options-api) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [watchEffect](https://vuejs.org/api/reactivity-core.html#watcheffect) - Vue.js docs
- [computed](https://vuejs.org/api/reactivity-core.html#computed) - Vue.js docs
