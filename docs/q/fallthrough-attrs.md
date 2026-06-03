---
order: 38
title: 'What are fallthrough attributes?'
difficulty: 'intermediate'
tags: ['components', 'watchers']
summary: "Attributes not declared in defineProps or defineEmits (class, style, id, aria-*, listeners) automatically forward to the component's root element."
---

Fallthrough attributes are props and event listeners passed to a component that aren't declared in `defineProps` or `defineEmits`. Vue automatically forwards them to the component's root element. This includes `class`, `style`, `id`, `data-*`, `aria-*`, and event listeners.

```vue
<!-- Parent -->
<BaseButton class="primary" data-testid="submit" @click="save">
  Save
</BaseButton>

<!-- BaseButton.vue (no class or click declared) -->
<template>
  <button><slot /></button>
</template>

<!-- Rendered HTML: attrs fall through to the root <button> -->
<button class="primary" data-testid="submit">Save</button>
```

<PlaygroundLink code="<!-- Parent -->
<BaseButton class=&quot;primary&quot; data-testid=&quot;submit&quot; @click=&quot;save&quot;>
  Save
</BaseButton>
&#10;<!-- BaseButton.vue (no class or click declared) -->
<template>
  <button><slot /></button>
</template>
&#10;<!-- Rendered HTML: attrs fall through to the root <button> -->
<button class=&quot;primary&quot; data-testid=&quot;submit&quot;>Save</button>" />

## Disabling automatic fallthrough

When a component has multiple root elements, or you need to apply attrs to a non-root element, disable inheritance and bind `$attrs` manually:

```vue
<script setup>
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="wrapper">
    <!-- Forward all attrs to the inner input, not the wrapper -->
    <input v-bind="$attrs" />
    <span class="icon">🔍</span>
  </div>
</template>
```

<PlaygroundLink code="<script setup>
defineOptions({ inheritAttrs: false })
</script>
&#10;<template>
  <div class=&quot;wrapper&quot;>
    <!-- Forward all attrs to the inner input, not the wrapper -->
    <input v-bind=&quot;$attrs&quot; />
    <span class=&quot;icon&quot;>🔍</span>
  </div>
</template>" />

    <span class=&quot;icon&quot;>🔍</span>
  </div>
</template>" />

## Accessing attrs in script

Use `useAttrs()` to read fallthrough attributes in `<script setup>`:

```vue
<script setup>
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

function handleClick(event: MouseEvent) {
  console.log('internal logic first')
  // Forward the original click listener
  const onClick = attrs.onClick as ((e: MouseEvent) => void) | undefined
  onClick?.(event)
}
</script>

<template>
  <button @click="handleClick"><slot /></button>
</template>
```

<PlaygroundLink code="<script setup>
import { useAttrs } from 'vue'
&#10;defineOptions({ inheritAttrs: false })
&#10;const attrs = useAttrs()
&#10;function handleClick(event: MouseEvent) {
  console.log('internal logic first')
  // Forward the original click listener
  const onClick = attrs.onClick as ((e: MouseEvent) => void) | undefined
  onClick?.(event)
}
</script>
&#10;<template>
  <button @click=&quot;handleClick&quot;><slot /></button>
</template>" />

## Attribute naming in $attrs

| Parent template      | Key in `$attrs`       |
| -------------------- | --------------------- |
| `class="foo"`        | `attrs.class`         |
| `data-id="123"`      | `attrs['data-id']`    |
| `aria-label="..."`   | `attrs['aria-label']` |
| `@click="fn"`        | `attrs.onClick`       |
| `@custom-event="fn"` | `attrs.onCustomEvent` |

Hyphenated attributes need bracket notation. Event listeners become camelCase `onX` keys.

## useAttrs is not reactive

`useAttrs()` always returns the latest values, but watchers don't track it:

```ts
const attrs = useAttrs()

// This watcher never fires on attr changes
watch(
  () => attrs.class,
  (val) => {
    /* dead code */
  }
)

// Use onBeforeUpdate instead
onBeforeUpdate(() => {
  console.log('current attrs:', attrs)
})
```

If you need to react to a specific attribute changing, promote it to a prop with `defineProps`. Props are fully reactive.

## When fallthrough attrs matter

| Scenario                                        | What to do                                                    |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Wrapper around a native element (input, button) | Let attrs fall through, or bind `$attrs` to the right element |
| Component with multiple roots                   | Set `inheritAttrs: false`, bind `$attrs` explicitly           |
| Need to intercept an event before forwarding    | Read `attrs.onClick`, call it after your logic                |
| Need reactive access to a specific attr         | Promote it to a declared prop                                 |

See also: [What is defineExpose?](/q/define-expose) · [What are slots?](/q/slots) · [What are functional components?](/q/functional-components)

## References

- [Fallthrough Attributes](https://vuejs.org/guide/components/attrs.html) - Vue.js docs
- [useAttrs()](https://vuejs.org/api/composition-api-helpers.html#useattrs) - Vue.js docs
- [inheritAttrs](https://vuejs.org/api/options-misc.html#inheritattrs) - Vue.js docs
