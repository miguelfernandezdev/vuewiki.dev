---
order: 113
title: "¿Cuáles son las limitaciones de defineProps basado en tipos?"
difficulty: "advanced"
tags: ["typescript", "components"]
summary: "El compilador de Vue resuelve tipos estáticamente — tipos condicionales, mapped types profundos y globals ambientales fallan. Aplana tipos en interfaces."
---

`defineProps<T>()` basado en tipos funciona con interfaces importadas y alias de tipo desde Vue 3.3, pero algunos patrones complejos de TypeScript fallan en tiempo de compilación porque el compilador de Vue resuelve los tipos estáticamente, no a través del sistema completo de tipos de TypeScript.

## Qué funciona

Interfaces simples, alias de tipo, uniones literales y genéricos:

```ts
// types/props.ts
export interface User {
  id: number
  name: string
  email?: string
}

export type Status = 'pending' | 'active' | 'completed'
```

```vue
<script setup lang="ts">
import type { User, Status } from '@/types/props'

defineProps<{
  user: User
  status: Status
  items: string[]
}>()
</script>
```

Usar una interfaz importada directamente como tipo de props también funciona:

```vue
<script setup lang="ts">
import type { User } from '@/types/props'

defineProps<User>()
</script>
```

## Qué no funciona

### Tipos condicionales como la forma completa de las props

```ts
export type InputProps<T> = T extends string
  ? { value: string; onChange: (v: string) => void }
  : { value: number; onChange: (v: number) => void }
```

```vue
<script setup lang="ts">
// ERROR: Vue no puede resolver tipos condicionales para el objeto de props
defineProps<InputProps<string>>()
</script>
```

**Solución:** resuelve el tipo manualmente:

```vue
<script setup lang="ts">
interface StringInputProps {
  value: string
  onChange: (v: string) => void
}

defineProps<StringInputProps>()
</script>
```

### Tipos mapeados complejos

```ts
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
```

```vue
<script setup lang="ts">
// Puede fallar o producir declaraciones de runtime incorrectas
defineProps<DeepReadonly<User>>()
</script>
```

**Solución:** aplana el tipo en una interfaz explícita:

```ts
export interface ReadonlyUser {
  readonly id: number
  readonly name: string
  readonly email?: string
}
```

### Tipos globales ambientales (sin export)

```ts
// global.d.ts
interface AppConfig {
  theme: string
  locale: string
}
```

```vue
<script setup lang="ts">
// ERROR: "Unresolvable type reference"
defineProps<{ config: AppConfig }>()
</script>
```

**Solución:** usa exports e imports explícitos en lugar de declaraciones ambientales:

```ts
// types/config.ts
export interface AppConfig {
  theme: string
  locale: string
}
```

### Tipos de node_modules (a veces)

Algunos tipos complejos de paquetes externos pueden fallar si internamente usan genéricos avanzados o tipos condicionales. La solución es la misma: crea una interfaz local que aplane el tipo externo.

## La regla general

Si el compilador de Vue puede resolver el tipo estáticamente como un conjunto de nombres de propiedades con tipos concretos, funciona. Si el tipo requiere evaluación en runtime, ramificación condicional o resolución recursiva de tipos, falla.

**Funciona:** interfaces, alias de tipo, uniones literales, `Pick`, `Omit`, `Partial`, `Required` (Vue 3.3+), genéricos simples.

**Falla:** tipos condicionales (`T extends X ? A : B`), tipos mapeados recursivos profundos, globals ambientales, algunos tipos entre paquetes.

## Solución con bloque script dual

Para casos donde necesitas computación compleja de tipos, resuélvelo en un bloque `<script>` regular:

```vue
<script lang="ts">
import type { ComplexGeneric } from '@/types'

type Resolved = ComplexGeneric<'variant-a'>
</script>

<script setup lang="ts">
defineProps<Resolved>()
</script>
```

El bloque script regular tiene acceso completo a TypeScript. El tipo resuelto es entonces suficientemente simple para que `<script setup>` lo gestione.

## Historial de versiones

| Versión de Vue | Qué está soportado |
|---|---|
| 3.2 | Solo tipos inline (sin imports) |
| 3.3 | Interfaces importadas, alias de tipo, enums |
| 3.4+ | Mejor soporte para `Pick`, `Omit`, genéricos entre archivos |

Ver también: [¿Cómo declarar props con TypeScript?](/es/q/props-with-typescript) · [¿Cómo funcionan los componentes genéricos?](/es/q/generic-components) · [¿Cuáles son los gotchas de withDefaults?](/es/q/withdefaults-gotchas)

## Referencias

- [Typing Component Props](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props) - Vue.js docs
- [defineProps()](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
