---
order: 159
title: "¿Qué es customRef y cuándo lo usarías?"
difficulty: "advanced"
tags: ["reactivity", "v-model"]
---

[customRef](https://vuejs.org/api/reactivity-advanced.html#customref) crea una ref donde tú controlas cuándo ocurre el rastreo de dependencias (`track`) y el disparo de actualizaciones (`trigger`). Las refs normales rastrean en cada lectura y disparan en cada escritura automáticamente. Con `customRef`, insertas tu propia lógica entre la lectura/escritura y el sistema de reactividad. El caso de uso clásico es una ref con debounce que retrasa el disparo de actualizaciones hasta que el usuario deja de escribir.

## Cómo funciona

`customRef` recibe una función de fábrica que recibe los callbacks `track` y `trigger`, y devuelve un objeto con `get` y `set`:

```ts
import { customRef } from 'vue'

function useDebouncedRef<T>(initialValue: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>
  let value = initialValue

  return customRef<T>((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      clearTimeout(timeout)
      value = newValue
      timeout = setTimeout(() => {
        trigger()
      }, delay)
    }
  }))
}
```

```vue
<script setup>
const searchQuery = useDebouncedRef('', 500)
</script>

<template>
  <!-- Escribir actualiza el valor interno inmediatamente,
       pero los watchers y computed solo se disparan tras 500ms sin actividad -->
  <input v-model="searchQuery" placeholder="Search..." />
  <p>Debounced value: {{ searchQuery }}</p>
</template>
```

Cada pulsación de tecla actualiza la variable interna `value`, pero `trigger()` solo se llama cuando el usuario lleva 500ms sin escribir. Eso significa que watchers, propiedades computed y re-renderizados del template todos esperan.

## track() y trigger() explicados

Estas dos funciones son el mismo mecanismo que usa `ref` internamente:

- **`track()`**: le dice a Vue "esta ref fue leída, así que lo que la está leyendo debe ser notificado cuando cambie". Llámala en `get()`.
- **`trigger()`**: le dice a Vue "esta ref cambió, vuelve a ejecutar todo lo que depende de ella". Llámala en `set()`, pero solo cuando decides que la actualización debe ocurrir.

Una `ref` normal llama a `track` en cada `get` y a `trigger` en cada `set`. `customRef` te permite omitir, retrasar o llamar condicionalmente a cualquiera de los dos.

## Ref con validación

Una ref que rechaza valores inválidos:

```ts
function useValidatedRef(initial: number, min: number, max: number) {
  let value = initial

  return customRef<number>((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      if (newValue >= min && newValue <= max) {
        value = newValue
        trigger()
      }
      // los valores inválidos se ignoran en silencio: sin trigger, sin re-renderizado
    }
  }))
}

const quantity = useValidatedRef(1, 1, 99)
quantity.value = 50   // funciona, dispara la actualización
quantity.value = 200  // ignorado, no ocurre nada
quantity.value = -5   // ignorado, no ocurre nada
```

## Ref sincronizada con localStorage

Persiste el valor de una ref en `localStorage` y lo hidrata al leer:

```ts
function useLocalStorageRef<T>(key: string, defaultValue: T) {
  return customRef<T>((track, trigger) => ({
    get() {
      track()
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    },
    set(newValue) {
      localStorage.setItem(key, JSON.stringify(newValue))
      trigger()
    }
  }))
}

const theme = useLocalStorageRef<'light' | 'dark'>('theme', 'light')
```

Cada lectura pasa por `localStorage`, así que incluso si otra pestaña cambia el valor, esta pestaña lo recoge en la siguiente lectura. El `set` escribe tanto en `localStorage` como dispara la reactividad de Vue.

## Cuándo usar customRef frente a alternativas

| Necesidad | Solución |
|---|---|
| Retrasar actualizaciones (debounce/throttle) | `customRef` |
| Validar antes de actualizar | `customRef` o un composable con setter |
| Sincronizar con almacenamiento externo | `customRef` |
| Transformar valores en lectura/escritura | `computed` con getter/setter |
| Reaccionar a cambios después del hecho | `watch` |
| Derivar un valor de otras refs | `computed` |

`customRef` es para los casos en que necesitas controlar el pipeline de reactividad en sí. Si solo necesitas transformar o derivar valores, `computed` es más simple.

## Reglas

1. Llama siempre a `track()` en `get()`. Si no lo haces, los dependientes no sabrán que deben volver a ejecutarse cuando el valor cambie.
2. Llama a `trigger()` solo cuando quieras notificar a los dependientes. Ese es el objetivo.
3. No llames a `trigger()` dentro de `get()`. Crea un bucle infinito.
4. La función de fábrica se ejecuta una vez. Los closures de `get`/`set` capturan `track` y `trigger` de forma permanente.

Ver también: [¿Qué es nextTick y cuándo lo necesitas?](/es/q/nexttick) · [¿Cuándo usarías shallowRef / shallowReactive?](/es/q/shallow-ref-reactive)

## Referencias

- [customRef() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#customref)
- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Reactividad en profundidad — Vue guide](https://vuejs.org/guide/extras/reactivity-in-depth.html)
