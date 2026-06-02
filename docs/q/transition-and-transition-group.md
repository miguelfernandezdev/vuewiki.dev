---
order: 62
title: "How do Transition and TransitionGroup work?"
difficulty: "intermediate"
tags: ["components", "animation"]
---

Vue provides two built-in components for animation. `<Transition>` animates a single element entering or leaving. `<TransitionGroup>` animates items in a list.

## Transition

Wrap a single element (or component) that toggles with `v-if` or `v-show`. Vue adds CSS classes at each stage of the enter/leave cycle.

```vue
<template>
  <button @click="show = !show">Toggle</button>

  <Transition name="fade">
    <p v-if="show">Hello</p>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

The class naming pattern with a `name` of `"fade"`:

```
.fade-enter-from   → .fade-enter-active → .fade-enter-to
.fade-leave-from   → .fade-leave-active → .fade-leave-to
```

## Transition modes

When swapping between two elements, both are visible at the same time by default. Use `mode="out-in"` to animate the old element out first, then the new one in.

```vue
<template>
  <Transition name="fade" mode="out-in">
    <p v-if="isActive" key="active">Active</p>
    <p v-else key="inactive">Inactive</p>
  </Transition>
</template>
```

Add `key` when swapping elements of the same type (`<p>` to `<p>`), otherwise Vue reuses the DOM node and the transition doesn't fire.

## Performance tip

Stick to `transform` and `opacity`. These properties are GPU-accelerated and don't trigger layout recalculation.

```css
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-12px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(12px);
  opacity: 0;
}
```

Avoid animating `height`, `width`, `margin`, or `top` as they cause expensive layout shifts.

## TransitionGroup

For lists rendered with `v-for`. Every child must have a unique `:key`.

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Animate remaining items when one is removed */
.list-move {
  transition: transform 0.3s ease;
}

.list-leave-active {
  position: absolute;
}
</style>
```

The `.list-move` class animates items that shift position when a sibling enters or leaves. Setting `position: absolute` on the leaving element lets the remaining items flow into place smoothly.

## Staggered list animations

Use JavaScript hooks with `data-index` for cascading effects:

```vue
<template>
  <TransitionGroup tag="ul" :css="false" @before-enter="onBeforeEnter" @enter="onEnter">
    <li v-for="(item, index) in items" :key="item.id" :data-index="index">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<script setup>
function onBeforeEnter(el: HTMLElement) {
  el.style.opacity = '0'
  el.style.transform = 'translateY(12px)'
}

function onEnter(el: HTMLElement, done: () => void) {
  const delay = Number(el.dataset.index) * 80
  setTimeout(() => {
    el.style.transition = 'all 0.25s ease'
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
    setTimeout(done, 250)
  }, delay)
}
</script>
```

## Transition vs TransitionGroup

| | `<Transition>` | `<TransitionGroup>` |
|---|---|---|
| Children | One element or component | Multiple (v-for list) |
| `mode` prop | Supported (`out-in`, `in-out`) | Not supported |
| `.move` class | No | Yes (animates reordering) |
| `tag` prop | No (renders no wrapper) | Yes (renders a wrapper element) |

See also: [What are dynamic components and KeepAlive?](/q/dynamic-components-keepalive) · [How do scoped styles work?](/q/css-scoped-modules-dynamic)

## References

- [Transition](https://vuejs.org/guide/built-ins/transition.html) - Vue.js docs
- [TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html) - Vue.js docs
