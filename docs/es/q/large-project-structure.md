---
order: 29
title: "¿Cómo estructurarías un proyecto Vue grande?"
difficulty: "advanced"
tags: ["architecture"]
---

```
src/
├── assets/              # Static assets
├── components/          # Shared/reusable components
│   ├── ui/              # Base UI components (Button, Input, Modal)
│   └── layout/          # Layout components (Header, Sidebar)
├── composables/         # Shared composables (useAuth, useFetch)
├── stores/              # Pinia stores (useUserStore, useCartStore)
├── views/               # Page-level components (routed)
├── router/              # Vue Router config
├── types/               # Shared TypeScript types/interfaces
├── utils/               # Pure utility functions
├── api/                 # API client / service layer
└── App.vue
```

**Principios:**

- Componentes de UI genéricos separados de los componentes de negocio
- Composables para lógica reutilizable
- Un store por dominio (no un único store gigante)
- Tipos compartidos en su propia carpeta
- Capa de API separada de los componentes
