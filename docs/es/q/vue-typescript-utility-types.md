---
order: 112
title: '¿Cuáles son los tipos de utilidad TypeScript clave para Vue?'
difficulty: 'advanced'
tags: ['typescript', 'watchers', 'provide-inject']
summary: 'Tipos clave: PropType (props runtime), ComponentPublicInstance (refs de componentes), ExtractPropTypes, MaybeRef/MaybeRefOrGetter (inputs de composables).'
---

Vue exporta varios tipos de utilidad que te ayudan a tipar props, refs, componentes y eventos correctamente. Conocerlos te ahorra escribir generics complejos a mano y te proporciona mejor soporte en el IDE.

## PropType

Fuerza un tipo específico en una declaración de prop en tiempo de ejecución. Solo es necesario con la Options API o declaraciones de prop en tiempo de ejecución, no con `defineProps` basado en tipos:

```ts
import type { PropType } from 'vue'

interface User {
  id: number
  name: string
}

export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    },
    status: {
      type: String as PropType<'active' | 'inactive'>,
      default: 'active'
    }
  }
})
```

Con `<script setup>` y props basados en tipos, no necesitas `PropType` en absoluto:

```ts
defineProps<{ user: User; status?: 'active' | 'inactive' }>()
```

## ExtractPropTypes / ExtractPublicPropTypes

Extraen los tipos de prop resueltos de un objeto de props en tiempo de ejecución. Útil cuando defines los props fuera del componente (por ejemplo, para definiciones de props compartidas):

```ts
import type { ExtractPropTypes, ExtractPublicPropTypes } from 'vue'

const buttonProps = {
  size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
  disabled: { type: Boolean, default: false }
} as const

// Tipo interno (lo que ve el componente, los defaults están resueltos)
type InternalProps = ExtractPropTypes<typeof buttonProps>
// { size: 'sm' | 'md' | 'lg'; disabled: boolean }

// Tipo público (lo que pasa el padre, los props opcionales siguen siendo opcionales)
type PublicProps = ExtractPublicPropTypes<typeof buttonProps>
// { size?: 'sm' | 'md' | 'lg'; disabled?: boolean }
```

## ComponentPublicInstance

El tipo de una instancia de componente visto desde el exterior (template refs):

```ts
import type { ComponentPublicInstance } from 'vue'

const compRef = ref<ComponentPublicInstance | null>(null)
```

Para un componente específico, usa `InstanceType`:

```ts
import MyForm from './MyForm.vue'

const formRef = ref<InstanceType<typeof MyForm> | null>(null)
```

`InstanceType<typeof Component>` te da acceso a lo que el componente expone mediante `defineExpose`.

## MaybeRef / MaybeRefOrGetter

Común en parámetros de composables. Acepta un valor, un ref o un getter:

```ts
import type { MaybeRef, MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}

// Todos válidos:
useTitle('Static Title')
useTitle(ref('Reactive Title'))
useTitle(() => `Page ${page.value}`)
```

`MaybeRef<T>` acepta `T | Ref<T>`. `MaybeRefOrGetter<T>` también acepta `() => T`. Usa `toValue()` para desempaquetar cualquiera de ellos.

## Ref / ComputedRef / ShallowRef

Tipos explícitos para referencias reactivas:

```ts
import type { Ref, ComputedRef, ShallowRef } from 'vue'

function useCounter(): { count: Ref<number>; doubled: ComputedRef<number> } {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)
  return { count, doubled }
}
```

Normalmente no los necesitas porque TypeScript los infiere. Son útiles para tipos de retorno explícitos en composables o parámetros de funciones.

## InjectionKey

provide/inject con tipos seguros:

```ts
import type { InjectionKey } from 'vue'

interface AuthContext {
  user: Ref<User | null>
  login: (credentials: Credentials) => Promise<void>
}

export const AUTH_KEY: InjectionKey<AuthContext> = Symbol('auth')

// Proveedor
provide(AUTH_KEY, { user, login })

// Consumidor, completamente tipado, sin cast necesario
const auth = inject(AUTH_KEY)!
```

## VNode

El tipo de un nodo del Virtual DOM. Útil cuando trabajas con funciones de render o manipulación de slots:

```ts
import type { VNode } from 'vue'

function renderItems(items: string[]): VNode[] {
  return items.map((item) => h('li', item))
}
```

## Referencia rápida

| Tipo                        | Caso de uso                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `PropType<T>`               | Tipar una declaración de prop en tiempo de ejecución              |
| `ExtractPropTypes<T>`       | Obtener los tipos de prop resueltos (interno, defaults aplicados) |
| `ExtractPublicPropTypes<T>` | Obtener los tipos de prop como los ve el padre                    |
| `InstanceType<typeof Comp>` | Tipar un template ref a un componente hijo                        |
| `ComponentPublicInstance`   | Tipo genérico de ref de componente                                |
| `MaybeRef<T>`               | Parámetro de composable que acepta `T` o `Ref<T>`                 |
| `MaybeRefOrGetter<T>`       | También acepta `() => T`                                          |
| `InjectionKey<T>`           | Clave de provide/inject con tipo seguro                           |
| `Ref<T>` / `ComputedRef<T>` | Tipos explícitos de ref para firmas de funciones                  |
| `VNode`                     | Nodo del Virtual DOM (funciones de render)                        |

Ver también: [¿Cómo declarar props con TypeScript?](/es/q/props-with-typescript) · [¿Qué es el Virtual DOM?](/es/q/virtual-dom) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [TypeScript with Composition API](https://vuejs.org/guide/typescript/composition-api.html) - Vue.js docs
- [Utility Types](https://vuejs.org/api/utility-types.html) - Vue.js docs
- [TypeScript](https://vuejs.org/guide/typescript/overview.html) - Vue.js docs
