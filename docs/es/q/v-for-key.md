---
order: 7
title: "¿Para qué sirve :key en v-for?"
difficulty: "beginner"
tags: ["directives"]
---

Vue usa `key` para identificar cada nodo del DOM y reutilizarlo de forma eficiente. Sin `key` (o con `key` = índice), Vue puede confundir elementos y provocar bugs en componentes con estado.

```vue
<!-- ✅ Correcto: key única por elemento -->
<li v-for="item in items" :key="item.id">{{ item.name }}</li>

<!-- ❌ Evitar: key = índice puede causar bugs -->
<li v-for="(item, index) in items" :key="index">{{ item.name }}</li>
```
