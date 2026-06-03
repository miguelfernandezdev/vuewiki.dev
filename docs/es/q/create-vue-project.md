---
order: 5
title: '¿Cómo se crea un proyecto Vue desde cero?'
difficulty: 'beginner'
tags: ['tooling', 'pinia', 'vite', 'vitest']
summary: 'Ejecuta npm create vue@latest para generar un proyecto con Vite y opciones de TypeScript, Router, Pinia, Vitest y ESLint.'
---

La forma oficial de iniciar un nuevo proyecto Vue es `create-vue`, que genera un proyecto basado en Vite con TypeScript, Router, Pinia, Vitest y ESLint opcionales.

## Usando create-vue

```bash
npm create vue@latest
```

El prompt interactivo pregunta qué necesitas:

```
✔ Project name: my-app
✔ Add TypeScript? Yes
✔ Add JSX Support? No
✔ Add Vue Router? Yes
✔ Add Pinia? Yes
✔ Add Vitest for Unit Testing? Yes
✔ Add an End-to-End Testing Solution? No
✔ Add ESLint for code quality? Yes
✔ Add Prettier for code formatting? Yes
```

Luego instala y ejecuta:

```bash
cd my-app
npm install
npm run dev
```

## Lo que genera el scaffold

```
my-app/
├── index.html            ← HTML de entrada (Vite lo usa como punto de entrada)
├── vite.config.ts        ← configuración de Vite + plugin Vue
├── tsconfig.json
├── src/
│   ├── main.ts           ← crea la app y la monta
│   ├── App.vue           ← componente raíz
│   ├── components/
│   ├── views/            ← (si se seleccionó Router)
│   ├── stores/           ← (si se seleccionó Pinia)
│   └── router/           ← (si se seleccionó Router)
├── public/               ← assets estáticos (se copian tal cual)
└── package.json
```

## El punto de entrada

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.mount('#app')
```

`createApp` crea la instancia de la aplicación. Los plugins se añaden con `.use()`. `.mount('#app')` la adjunta al elemento del DOM en `index.html`.

## Por qué Vite y no Webpack

Vue CLI (basado en Webpack) está en modo mantenimiento. Vite es la herramienta de build recomendada para nuevos proyectos Vue:

|                                     | Vite                                         | Webpack (Vue CLI)                                              |
| ----------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Arranque del servidor de desarrollo | Instantáneo (módulos ES nativos)             | Lento (bundlea todo primero)                                   |
| Hot Module Replacement              | Rápido (solo actualiza el módulo modificado) | Más lento (vuelve a hacer el bundle del grafo de dependencias) |
| Herramienta de build                | Rollup (producción)                          | Webpack                                                        |
| Configuración                       | Mínima por defecto                           | Verbosa                                                        |
| Estado                              | En desarrollo activo                         | Modo mantenimiento                                             |

## Configuración manual mínima

Si quieres entender lo que hace `create-vue`, aquí está el mínimo:

```bash
npm init -y
npm install vue
npm install -D vite @vitejs/plugin-vue
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
```

Son cuatro archivos. Todo lo demás que añade `create-vue` es tooling opcional encima de esto.

Ver también: [¿Qué es Vite?](/es/q/what-is-vite) · [¿Cómo estructurar un proyecto Vue grande?](/es/q/large-project-structure) · [¿Cómo ayudan las Vue DevTools a depurar?](/es/q/vue-devtools)

## Referencias

- [Quick Start](https://vuejs.org/guide/quick-start.html) - Vue.js docs
- [Getting Started](https://vite.dev/guide/) - Vite docs
- [create-vue](https://github.com/vuejs/create-vue) - GitHub
