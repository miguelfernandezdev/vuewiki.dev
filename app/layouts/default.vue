<script setup lang="ts">
const totalQuestions = 30
</script>

<template>
  <div class="min-h-screen bg-(--ui-bg)">
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-1.5">
          <span class="text-xl font-bold text-(--ui-primary)">VueWiki</span>
          <span class="text-sm text-(--ui-text-muted)">.dev</span>
        </NuxtLink>
      </template>

      <template #right>
        <UBadge color="neutral" variant="subtle">
          {{ totalQuestions }} questions
        </UBadge>
        <UButton
          to="https://github.com/miguelfernandezdev/vuewiki.dev"
          target="_blank"
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </template>
    </UHeader>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <slot />
    </main>

    <footer class="border-t border-(--ui-border) mt-16">
      <div class="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-(--ui-text-muted)">
        Built with Nuxt. Open source on
        <ULink
          to="https://github.com/miguelfernandezdev/vuewiki.dev"
          target="_blank"
        >
          GitHub
        </ULink>.
      </div>
    </footer>
  </div>
</template>
