<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { completedLocales, translationIssues } from './i18n'

const { lang } = useData()

const showBanner = computed(
  () => !completedLocales.has(lang.value) && !!translationIssues[lang.value]
)

const issueUrl = computed(
  () =>
    `https://github.com/miguelfernandezdev/vuewiki.dev/issues/${translationIssues[lang.value]}`
)

const langNames: Record<string, string> = {
  zh: '中文',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  ru: 'Русский',
  ar: 'العربية',
  vi: 'Tiếng Việt',
  hi: 'हिन्दी'
}

const langName = computed(() => langNames[lang.value] || lang.value)
</script>

<template>
  <div v-if="showBanner" class="translation-banner">
    <p>
      <span class="banner-icon">🌐</span> This page is not yet translated to
      {{ langName }}.
      <a :href="issueUrl" target="_blank" rel="noopener">
        Help translate it →
      </a>
    </p>
  </div>
</template>

<style scoped>
.translation-banner {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-2);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.translation-banner p {
  margin: 0;
  line-height: 1.5;
}

.translation-banner a {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: none;
}

.translation-banner a:hover {
  text-decoration: underline;
}

.banner-icon {
  margin-right: 0.25rem;
}
</style>
