---
order: 26
title: "What's the difference between computed and watch?"
difficulty: "advanced"
tags: ["reactivity", "composition-api"]
---

| | `computed` | `watch` |
|---|---|---|
| **Purpose** | Derive a value | Execute side effects |
| **Returns** | Yes, returns a value | No |
| **Caching** | Yes (recalculates only if deps change) | No |
| **Timing** | Synchronous, lazy | Can be async |
| **Example** | `fullName = computed(() => first + last)` | `watch(route, () => fetchData())` |

**Rule:** If you need a derived value → `computed`. If you need to DO something when a value changes (API call, localStorage, logging) → `watch`.
