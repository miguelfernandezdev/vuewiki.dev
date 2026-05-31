<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useI18n } from './i18n'

const { frontmatter, lang } = useData()
const { t } = useI18n()

const isQuestion = computed(() => !!frontmatter.value.difficulty)

const backUrl = computed(() => lang.value === 'es' ? '/es/' : '/')

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
}
</script>

<template>
  <div v-if="isQuestion" class="question-meta">
    <a :href="backUrl" class="back-link">{{ t('detail.back') }}</a>

    <div class="meta-header">
      <span :class="['difficulty-badge', difficultyClass[frontmatter.difficulty]]">
        {{ t(`filters.${frontmatter.difficulty}`) }}
      </span>
    </div>

    <h1 class="question-title">{{ frontmatter.title }}</h1>

    <div v-if="frontmatter.tags?.length" class="tag-list">
      <span v-for="tag in frontmatter.tags" :key="tag" class="tag-badge">
        {{ t(`tags.${tag}`) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.question-meta {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--vp-c-brand-1);
}

.meta-header {
  margin-bottom: 0.75rem;
}

.question-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  margin: 0 0 1rem;
  border: none;
  padding: 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tag-badge {
  font-size: 0.75rem;
  padding: 0.1875rem 0.5rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-border);
}

.difficulty-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
}

.badge-beginner {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-2);
}

.badge-intermediate {
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-2);
}

.badge-advanced {
  background: var(--vp-c-red-soft);
  color: var(--vp-c-red-2);
}
</style>
