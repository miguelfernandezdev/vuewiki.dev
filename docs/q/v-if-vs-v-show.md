---
order: 6
title: "What's the difference between v-if and v-show?"
difficulty: "beginner"
tags: ["directives"]
---

- **`v-if`**: mounts/unmounts the element from the DOM. More expensive to toggle, but doesn't render if initially `false`.
- **`v-show`**: always mounts the element, just toggles `display: none`. More efficient for frequent toggles.

**Rule:** `v-if` for conditions that rarely change. `v-show` for frequent toggles (tabs, dropdowns).
