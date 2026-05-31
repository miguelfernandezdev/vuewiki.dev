---
order: 7
title: "What's the purpose of :key in v-for?"
difficulty: "beginner"
---

Vue uses `key` to identify each DOM node and reuse it efficiently. Without `key` (or with `key` = index), Vue can mix up elements and cause bugs in stateful components.

```vue
<!-- ✅ Correct: unique key per item -->
<li v-for="item in items" :key="item.id">{{ item.name }}</li>

<!-- ❌ Avoid: key = index can cause bugs -->
<li v-for="(item, index) in items" :key="index">{{ item.name }}</li>
```
