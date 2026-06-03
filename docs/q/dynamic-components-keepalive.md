---
order: 34
title: 'What are dynamic components and how does KeepAlive work?'
difficulty: 'intermediate'
tags: ['components', 'performance', 'slots', 'suspense', 'teleport']
summary: '<component :is> switches components at runtime. <KeepAlive> caches instances in memory instead of destroying them on each switch.'
---

Dynamic components let you switch between components at runtime using the built-in `<component>` element with the `:is` prop. By default, Vue destroys the old component and creates a new one on each switch. `<KeepAlive>` changes that behavior by caching instances in memory.

## Dynamic components

```vue
<script setup>
import { ref, shallowRef } from 'vue'
import TabHome from './TabHome.vue'
import TabSettings from './TabSettings.vue'
import TabProfile from './TabProfile.vue'

const tabs = { TabHome, TabSettings, TabProfile }
const currentTab = shallowRef(TabHome)
</script>

<template>
  <button v-for="(comp, name) in tabs" :key="name" @click="currentTab = comp">
    {{ name }}
  </button>

  <!-- Destroyed and recreated on every switch -->
  <component :is="currentTab" />
</template>
```

<PlaygroundLink code="<script setup>
import { ref, shallowRef } from 'vue'
import TabHome from './TabHome.vue'
import TabSettings from './TabSettings.vue'
import TabProfile from './TabProfile.vue'
&#10;const tabs = { TabHome, TabSettings, TabProfile }
const currentTab = shallowRef(TabHome)
</script>
&#10;<template>
  <button v-for=&quot;(comp, name) in tabs&quot; :key=&quot;name&quot; @click=&quot;currentTab = comp&quot;>
    {{ name }}
  </button>
&#10;  <!-- Destroyed and recreated on every switch -->
  <component :is=&quot;currentTab&quot; />
</template>" />

</template>" />

Without `KeepAlive`, any local state in `TabSettings` (form inputs, scroll position, expanded sections) resets every time you switch away and back.

## Adding KeepAlive

Wrap `<component>` in `<KeepAlive>` to cache instances instead of destroying them.

```vue
<template>
  <KeepAlive>
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

<PlaygroundLink code="<template>
  <KeepAlive>
    <component :is=&quot;currentTab&quot; />
  </KeepAlive>
</template>" />

  </KeepAlive>
</template>" />

Now switching tabs preserves each component's full state.

## Controlling what gets cached

Use `include`, `exclude`, and `max` to limit caching.

```vue
<template>
  <!-- Only cache these two -->
  <KeepAlive include="TabHome,TabSettings">
    <component :is="currentTab" />
  </KeepAlive>

  <!-- Cache everything except this one -->
  <KeepAlive exclude="TabProfile">
    <component :is="currentTab" />
  </KeepAlive>

  <!-- Cache at most 5 instances (LRU eviction) -->
  <KeepAlive :max="5">
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

<PlaygroundLink code="<template>
  <!-- Only cache these two -->
  <KeepAlive include=&quot;TabHome,TabSettings&quot;>
    <component :is=&quot;currentTab&quot; />
  </KeepAlive>
&#10;  <!-- Cache everything except this one -->
  <KeepAlive exclude=&quot;TabProfile&quot;>
    <component :is=&quot;currentTab&quot; />
  </KeepAlive>
&#10;  <!-- Cache at most 5 instances (LRU eviction) -->
  <KeepAlive :max=&quot;5&quot;>
    <component :is=&quot;currentTab&quot; />
  </KeepAlive>
</template>" />

  </KeepAlive>
&#10;  <!-- Cache everything except this one -->
  <KeepAlive exclude=&quot;TabProfile&quot;>
    <component :is=&quot;currentTab&quot; />
  </KeepAlive>
&#10;  <!-- Cache at most 5 instances (LRU eviction) -->
  <KeepAlive :max=&quot;5&quot;>
    <component :is=&quot;currentTab&quot; />
  </KeepAlive>
</template>" />

`include` and `exclude` match the component's `name`. Set it explicitly with `defineOptions`:

```vue
<script setup>
defineOptions({ name: 'TabSettings' })
</script>
```

<PlaygroundLink code="<script setup>
defineOptions({ name: 'TabSettings' })
</script>" />

## Lifecycle hooks for cached components

Cached components don't fire `onMounted`/`onUnmounted` on switch. Use `onActivated` and `onDeactivated` instead.

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  // Component became visible again, refresh data if needed
  refreshData()
})

onDeactivated(() => {
  // Component hidden but still alive, pause background work
  pausePolling()
})
</script>
```

<PlaygroundLink code="<script setup>
import { onActivated, onDeactivated } from 'vue'
&#10;onActivated(() => {
  // Component became visible again, refresh data if needed
  refreshData()
})
&#10;onDeactivated(() => {
  // Component hidden but still alive, pause background work
  pausePolling()
})
</script>" />

Full lifecycle for a cached component:

```
onMounted → onActivated → (user switches away) → onDeactivated
         → (user switches back) → onActivated → ...
         → (cache evicted or parent destroyed) → onUnmounted
```

## KeepAlive with Vue Router

```vue
<template>
  <router-view v-slot="{ Component, route }">
    <KeepAlive>
      <component :is="Component" :key="route.fullPath" />
    </KeepAlive>
  </router-view>
</template>
```

<PlaygroundLink code="<template>
  <router-view v-slot=&quot;{ Component, route }&quot;>
    <KeepAlive>
      <component :is=&quot;Component&quot; :key=&quot;route.fullPath&quot; />
    </KeepAlive>
  </router-view>
</template>" />

    </KeepAlive>
  </router-view>
</template>" />

Using `route.fullPath` as the key means `/users/1` and `/users/2` are cached separately.

## When NOT to use KeepAlive

| Scenario                                          | Why                              |
| ------------------------------------------------- | -------------------------------- |
| Memory-heavy components (maps, large tables)      | Cached instances stay in memory  |
| Sensitive data (auth forms, payment flows)        | Data should be cleared on exit   |
| Components with background timers you can't pause | They keep running while hidden   |
| Pages where users expect fresh results            | Stale cached data confuses users |

See also: [What are async components?](/q/async-components) · [What are Teleport, Fragments, and Suspense?](/q/teleport-fragments-suspense) · [How does the `is` attribute work?](/q/is-attribute-dynamic-rendering)

## References

- [Dynamic Components](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components) - Vue.js docs
- [KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html) - Vue.js docs
