---
order: 29
title: "How would you structure a large Vue project?"
difficulty: "advanced"
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

**Principles:**
- Generic UI components separate from business components
- Composables for reusable logic
- One store per domain (not one giant store)
- Shared types in their own folder
- API layer separate from components
