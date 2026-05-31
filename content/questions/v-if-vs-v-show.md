---
order: 6
title: "What's the difference between v-if and v-show?"
difficulty: "beginner"
---

- **`v-if`** — Mounts/unmounts the element from the DOM. More expensive to toggle, but doesn't render if initially `false`.
- **`v-show`** — Always mounts the element, just toggles `display: none`. More efficient for frequent toggles.

**Rule:** `v-if` for conditions that rarely change. `v-show` for frequent toggles (tabs, dropdowns).
