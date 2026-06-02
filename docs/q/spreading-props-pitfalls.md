---
order: 44
title: "Why can spreading all props to a child component be a bad idea?"
difficulty: "intermediate"
tags: ["components"]
summary: "Spreading all props hides the component's API, causes unnecessary re-renders, and can leak sensitive data. Pass only what the child explicitly needs."
---

Spreading all props with `v-bind="$attrs"` or passing an entire object as props sends everything the parent has to the child, including attributes the child doesn't need. This causes unnecessary re-renders, hides the component's actual API, and can leak sensitive data or create naming collisions. Pass only what the child needs explicitly.

## The problem

```vue
<!-- Parent -->
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
  <!-- BAD: passes everything, including data the child shouldn't see -->
  <UserCard v-bind="user" />
</template>
```

```vue
<!-- UserCard.vue -->
<script setup>
defineProps<{ name: string; email: string }>()
// Only uses name and email, but receives id, role, internalNotes, passwordHash too
</script>
```

The child declares `name` and `email` as props. The rest (`id`, `role`, `internalNotes`, `passwordHash`) fall through as HTML attributes on the root element. Open DevTools and you'll see `<div passwordhash="..." internalnotes="...">` in the DOM.

## Five reasons to avoid it

### 1. Leaking data to the DOM

Undeclared props become fallthrough attributes. They end up as HTML attributes on the child's root element, visible to anyone inspecting the page:

```html
<!-- Rendered DOM -->
<div class="user-card"
     id="1"
     role="admin"
     internalnotes="High priority account"
     passwordhash="...">
  Alice
</div>
```

`role` is particularly dangerous because it's a valid HTML attribute (ARIA role), so it silently overwrites accessibility semantics.

### 2. Unnecessary re-renders

Every property in the spread is a prop. When any property changes, Vue re-renders the child, even if the child doesn't use that property:

```vue
<template>
  <!-- Every time user.lastLoginAt changes, UserCard re-renders -->
  <UserCard v-bind="user" />

  <!-- Only re-renders when name or email change -->
  <UserCard :name="user.name" :email="user.email" />
</template>
```

### 3. Hidden component API

Explicit props document the component's interface. With spreading, you can't tell from the template what data the child needs:

```vue
<!-- What does ProfileHeader actually need? No idea. -->
<ProfileHeader v-bind="user" />

<!-- Clear: it needs name, avatar, and role -->
<ProfileHeader :name="user.name" :avatar="user.avatar" :role="user.role" />
```

### 4. Naming collisions

The spread may include properties that conflict with the child's own attributes:

```vue
<script setup>
defineProps<{ class: string; style: string }>()
// If the parent spreads an object with class or style, they merge/override
</script>
```

More subtly, if the parent's object has a `key` property, it interferes with Vue's `v-for` reconciliation.

### 5. TypeScript loses track

When you spread a generic object, TypeScript can't validate that the child receives the correct types:

```vue
<!-- TypeScript can't check this -->
<UserCard v-bind="someObject" />

<!-- TypeScript validates each prop -->
<UserCard :name="someObject.name" :email="someObject.email" />
```

## When v-bind="$attrs" is appropriate

Forwarding attributes intentionally in wrapper components is the valid use case:

```vue
<!-- BaseInput.vue: a thin wrapper that forwards all attrs to the real input -->
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
<!-- Parent -->
<BaseInput label="Email" type="email" placeholder="you@example.com" required />
```

Here the wrapper exists specifically to forward attributes. The parent's `type`, `placeholder`, and `required` reach the `<input>` as intended. This is different from blindly spreading a data object.

## The fix: pass only what's needed

```vue
<!-- BAD -->
<UserCard v-bind="user" />

<!-- GOOD -->
<UserCard :name="user.name" :email="user.email" />
```

If many components need the same subset of user data, create a computed or a type for it:

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

Now the spread is intentional and typed. The object contains exactly what `UserCard` expects, nothing more.

See also: [What are fallthrough attributes?](/q/fallthrough-attrs) · [How do you declare props with TypeScript?](/q/props-with-typescript)

## References

- [Fallthrough Attributes](https://vuejs.org/guide/components/attrs.html) - Vue.js docs
- [v-bind](https://vuejs.org/api/built-in-directives.html#v-bind) - Vue.js docs
