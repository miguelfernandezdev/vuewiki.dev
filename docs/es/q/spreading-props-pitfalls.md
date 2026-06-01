---
order: 134
title: "¿Por qué puede ser mala idea pasar todas las props a un componente hijo con spread?"
difficulty: "intermediate"
tags: ["components"]
---

Pasar todas las props con `v-bind="$attrs"` o enviar un objeto entero como props manda al hijo todo lo que tiene el padre, incluyendo atributos que el hijo no necesita. Esto provoca re-renders innecesarios, oculta la API real del componente y puede filtrar datos sensibles o crear colisiones de nombres. Pasa solo lo que el hijo necesita, de forma explícita.

## El problema

```vue
<!-- Padre -->
<script setup>
const user = ref({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin',
  internalNotes: 'High priority account',
  passwordHash: '...'
})
</script>

<template>
  <!-- MAL: pasa todo, incluyendo datos que el hijo no debería ver -->
  <UserCard v-bind="user" />
</template>
```

```vue
<!-- UserCard.vue -->
<script setup>
defineProps<{ name: string; email: string }>()
// Solo usa name y email, pero recibe id, role, internalNotes, passwordHash también
</script>
```

El hijo declara `name` y `email` como props. El resto (`id`, `role`, `internalNotes`, `passwordHash`) cae como atributos HTML en el elemento raíz. Abre las DevTools y verás `<div passwordhash="..." internalnotes="...">` en el DOM.

## Cinco razones para evitarlo

### 1. Filtración de datos al DOM

Las props no declaradas se convierten en atributos fallthrough. Acaban como atributos HTML en el elemento raíz del hijo, visibles para cualquiera que inspeccione la página:

```html
<!-- DOM renderizado -->
<div class="user-card"
     id="1"
     role="admin"
     internalnotes="High priority account"
     passwordhash="...">
  Alice
</div>
```

`role` es especialmente peligroso porque es un atributo HTML válido (ARIA role), así que sobrescribe silenciosamente la semántica de accesibilidad.

### 2. Re-renders innecesarios

Cada propiedad del spread se convierte en una prop. Cuando cualquier propiedad cambia, Vue re-renderiza el hijo, aunque el hijo no use esa propiedad:

```vue
<template>
  <!-- Cada vez que user.lastLoginAt cambia, UserCard se re-renderiza -->
  <UserCard v-bind="user" />

  <!-- Solo se re-renderiza cuando name o email cambian -->
  <UserCard :name="user.name" :email="user.email" />
</template>
```

### 3. API del componente oculta

Las props explícitas documentan la interfaz del componente. Con spread, no puedes saber desde el template qué datos necesita el hijo:

```vue
<!-- ¿Qué necesita ProfileHeader exactamente? No hay manera de saberlo. -->
<ProfileHeader v-bind="user" />

<!-- Claro: necesita name, avatar y role -->
<ProfileHeader :name="user.name" :avatar="user.avatar" :role="user.role" />
```

### 4. Colisiones de nombres

El spread puede incluir propiedades que entran en conflicto con los atributos propios del hijo:

```vue
<script setup>
defineProps<{ class: string; style: string }>()
// Si el padre hace spread de un objeto con class o style, se mezclan o se sobreescriben
</script>
```

Más sutilmente, si el objeto del padre tiene una propiedad `key`, interfiere con la reconciliación de `v-for` de Vue.

### 5. TypeScript pierde el control

Cuando haces spread de un objeto genérico, TypeScript no puede validar que el hijo reciba los tipos correctos:

```vue
<!-- TypeScript no puede verificar esto -->
<UserCard v-bind="someObject" />

<!-- TypeScript valida cada prop -->
<UserCard :name="someObject.name" :email="someObject.email" />
```

## Cuándo es apropiado v-bind="$attrs"

Reenviar atributos intencionalmente en componentes envolventes es el caso de uso válido:

```vue
<!-- BaseInput.vue: un wrapper fino que reenvía todos los attrs al input real -->
<script setup>
defineOptions({ inheritAttrs: false })
defineProps<{ label: string }>()
</script>

<template>
  <label>
    {{ label }}
    <input v-bind="$attrs" />
  </label>
</template>
```

```vue
<!-- Padre -->
<BaseInput label="Email" type="email" placeholder="you@example.com" required />
```

Aquí el wrapper existe específicamente para reenviar atributos. El `type`, `placeholder` y `required` del padre llegan al `<input>` como se espera. Esto es distinto a hacer spread ciegamente de un objeto de datos.

## La solución: pasa solo lo necesario

```vue
<!-- MAL -->
<UserCard v-bind="user" />

<!-- BIEN -->
<UserCard :name="user.name" :email="user.email" />
```

Si varios componentes necesitan el mismo subconjunto de datos del usuario, crea un computed o un tipo para ello:

```vue
<script setup>
interface UserSummary {
  name: string
  email: string
}

const userSummary = computed<UserSummary>(() => ({
  name: user.value.name,
  email: user.value.email
}))
</script>

<template>
  <UserCard v-bind="userSummary" />
</template>
```

Ahora el spread es intencional y tiene tipado. El objeto contiene exactamente lo que `UserCard` espera, nada más.
