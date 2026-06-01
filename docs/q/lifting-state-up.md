---
order: 56
title: "What is lifting state up and when should you do it?"
difficulty: "beginner"
tags: ["components", "architecture"]
---

Lifting state up means moving shared data from a child component to the nearest common ancestor so that multiple children can access and stay in sync with the same state.

## The problem

Two sibling components need access to the same data, but each manages its own copy. They get out of sync.

```
App
├── TemperatureInput (Celsius)   ← has its own state
└── TemperatureInput (Fahrenheit) ← has its own state
```

Each input tracks temperature independently. Typing in one doesn't update the other.

## The solution: lift state to the parent

```vue
<!-- App.vue -->
<template>
  <TemperatureInput
    label="Celsius"
    :value="celsius"
    @update="celsius = $event"
  />
  <TemperatureInput
    label="Fahrenheit"
    :value="fahrenheit"
    @update="updateFromFahrenheit"
  />
</template>

<script setup>
import { ref, computed } from 'vue'

const celsius = ref(0)

const fahrenheit = computed(() => celsius.value * 9 / 5 + 32)

function updateFromFahrenheit(f: number) {
  celsius.value = (f - 32) * 5 / 9
}
</script>
```

```vue
<!-- TemperatureInput.vue -->
<script setup>
defineProps<{ label: string; value: number }>()
const emit = defineEmits<{ update: [value: number] }>()
</script>

<template>
  <label>
    {{ label }}
    <input
      type="number"
      :value="value"
      @input="emit('update', Number(($event.target as HTMLInputElement).value))"
    />
  </label>
</template>
```

Now the parent is the single source of truth. Both inputs always show consistent values.

## When to lift state

| Situation | Action |
|---|---|
| Only one component uses the data | Keep it local |
| Parent and child share data | Props down, emit up |
| Siblings need the same data | Lift to the nearest common parent |
| Distant components across the tree | `provide`/`inject` or Pinia |

## When lifting becomes painful

If you're passing props through 3+ levels of components that don't use the data themselves ("prop drilling"), lifting state is no longer the right tool. Switch to:

- **`provide` / `inject`** for subtree-scoped shared state without prop drilling.
- **Pinia** for global or cross-feature state that many unrelated components need.

```
App                         App (with provide)
├── Layout                  ├── Layout
│   ├── Sidebar             │   ├── Sidebar
│   │   └── UserMenu ← needs user    │   │   └── UserMenu ← inject('user')
│   └── Main                │   └── Main
│       └── Header ← needs user      │       └── Header ← inject('user')
```

The rule: lift state to the nearest common ancestor that makes the data flow simple and obvious. If that ancestor is too far away, use a different sharing mechanism.
