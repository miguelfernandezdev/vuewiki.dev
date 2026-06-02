<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { computed, watch, onMounted } from 'vue'
import { useI18n } from './i18n'
import { useReadTracker } from './useReadTracker'

const { frontmatter, lang } = useData()
const { t } = useI18n()
const route = useRoute()
const { isRead, markRead, toggleRead } = useReadTracker()

const isQuestion = computed(() => !!frontmatter.value.difficulty)
const backUrl = computed(() => lang.value === 'es' ? '/es/' : '/')
const questionUrl = computed(() => route.path)

onMounted(() => {
  if (isQuestion.value) markRead(questionUrl.value)
})

watch(() => route.path, () => {
  if (isQuestion.value) markRead(questionUrl.value)
})

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
      <button
        :class="['read-btn', { active: isRead(questionUrl) }]"
        @click.prevent="toggleRead(questionUrl)"
      >
        <svg v-if="isRead(questionUrl)" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
        </svg>
        {{ isRead(questionUrl) ? t('detail.read') : t('detail.markRead') }}
      </button>
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.read-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.read-btn:hover {
  border-color: var(--vp-c-green-2);
  color: var(--vp-c-green-2);
}

.read-btn.active {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-2);
  border-color: var(--vp-c-green-2);
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
