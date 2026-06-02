<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as allQuestions } from './questions.data'
import { useI18n } from './i18n'
import { useReadTracker } from './useReadTracker'

const { lang } = useData()
const { t } = useI18n()
const { readCount, isRead } = useReadTracker()

const questions = computed(() =>
  allQuestions.filter(q => q.locale === lang.value),
)

const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced'] as const

const groups = computed(() =>
  DIFFICULTY_ORDER.map(diff => {
    const qs = questions.value.filter(q => q.difficulty === diff)
    const readTotal = qs.filter(q => isRead(q.url)).length
    return { difficulty: diff, questions: qs, readTotal }
  }),
)

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
}

const homeBase = computed(() => lang.value === 'es' ? '/es/' : '/')

</script>

<template>
  <div class="questions-page">
    <div class="page-header">
      <h1>{{ t('questionsPage.title') }}</h1>
      <p class="page-subtitle">
        {{ t('questionsPage.subtitle', { read: readCount, total: questions.length }) }}
      </p>
    </div>

    <div v-for="group in groups" :key="group.difficulty" class="difficulty-group">
      <div class="group-header">
        <a
          :href="`${homeBase}?difficulty=${group.difficulty}`"
          :class="['difficulty-badge', difficultyClass[group.difficulty]]"
        >
          {{ t(`filters.${group.difficulty}`) }}
        </a>
        <span class="group-count">{{ group.questions.length }}</span>
        <div class="group-progress">
          <div class="group-progress-bar">
            <div
              class="group-progress-fill"
              :class="`fill-${group.difficulty}`"
              :style="{ width: group.questions.length ? `${(group.readTotal / group.questions.length) * 100}%` : '0%' }"
            />
          </div>
          <span class="group-progress-label">{{ group.readTotal }}/{{ group.questions.length }}</span>
        </div>
      </div>

      <div class="group-list">
        <a
          v-for="q in group.questions"
          :key="q.url"
          :href="q.url"
          :class="['question-row', { 'is-read': isRead(q.url) }]"
        >
          <span :class="['read-check', { read: isRead(q.url) }]">
            <svg v-if="isRead(q.url)" width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="question-text">{{ q.title }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.questions-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

.difficulty-group {
  margin-bottom: 2rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--vp-c-border);
}

.group-count {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
}

.group-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.group-progress-bar {
  width: 100px;
  height: 5px;
  border-radius: 3px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.group-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.fill-beginner { background: var(--vp-c-green-2); }
.fill-intermediate { background: var(--vp-c-yellow-2); }
.fill-advanced { background: var(--vp-c-red-2); }

.group-progress-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.group-list {
  display: flex;
  flex-direction: column;
}

.question-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.15s;
}

.question-row:hover {
  background: var(--vp-c-bg-soft);
}

.question-row.is-read .question-text {
  color: var(--vp-c-text-3);
}

.read-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid var(--vp-c-border);
  flex-shrink: 0;
  transition: all 0.2s;
  color: transparent;
}

.read-check.read {
  background: var(--vp-c-green-2);
  border-color: var(--vp-c-green-2);
  color: white;
}

.question-text {
  font-size: 0.9375rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.difficulty-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
  text-decoration: none;
  transition: opacity 0.15s;
}

.difficulty-badge:hover {
  opacity: 0.8;
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
