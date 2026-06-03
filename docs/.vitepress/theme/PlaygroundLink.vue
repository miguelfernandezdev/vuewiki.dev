<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  code: string
  title?: string
}>()

function utoa(data: string): string {
  return btoa(unescape(encodeURIComponent(data)))
}

const playgroundUrl = computed(() => {
  const files = { 'App.vue': props.code }
  return `https://play.vuejs.org/#${utoa(JSON.stringify(files))}`
})
</script>

<template>
  <a
    :href="playgroundUrl"
    target="_blank"
    rel="noopener"
    class="playground-link"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
    {{ title || 'Open in Vue Playground' }}
  </a>
</template>

<style scoped>
.playground-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  text-decoration: none;
  transition: all 0.2s;
}

.playground-link:hover {
  background: var(--vp-c-brand-2);
  color: white;
}

.playground-link svg {
  flex-shrink: 0;
}
</style>
