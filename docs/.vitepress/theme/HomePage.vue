<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from 'vitepress'
import { data as allQuestions } from './questions.data'
import { useI18n } from './i18n'

const { lang } = useData()
const { t } = useI18n()

const questions = computed(() =>
  allQuestions.filter(q => q.locale === lang.value),
)

const search = ref('')
const activeFilter = ref<string | null>(null)
const activeTag = ref<string | null>(null)

const allTags = computed(() => {
  const tags = new Set<string>()
  questions.value.forEach(q => q.tags.forEach(tag => tags.add(tag)))
  return Array.from(tags).sort()
})

const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(search.value.toLowerCase())
    const matchesFilter = !activeFilter.value || q.difficulty === activeFilter.value
    const matchesTag = !activeTag.value || q.tags.includes(activeTag.value)
    return matchesSearch && matchesFilter && matchesTag
  })
})

const PAGE_SIZE = 30
const visibleCount = ref(PAGE_SIZE)

const visibleQuestions = computed(() =>
  filteredQuestions.value.slice(0, visibleCount.value),
)

const hasMore = computed(() =>
  visibleCount.value < filteredQuestions.value.length,
)

function showMore() {
  visibleCount.value += PAGE_SIZE
}

// Reset visible count when filters change
function setFilter(value: string | null) {
  activeFilter.value = value
  visibleCount.value = PAGE_SIZE
}

function setTag(value: string | null) {
  activeTag.value = value
  visibleCount.value = PAGE_SIZE
}

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
}
</script>

<template>
  <div class="home-page">
    <div class="search-wrapper">
      <input
        v-model="search"
        type="text"
        :placeholder="t('home.searchPlaceholder')"
        class="search-input"
      />
    </div>

    <section class="content">
      <div class="filter-row">
        <button
          v-for="f in [
            { label: t('filters.all'), value: null },
            { label: t('filters.beginner'), value: 'beginner' },
            { label: t('filters.intermediate'), value: 'intermediate' },
            { label: t('filters.advanced'), value: 'advanced' },
          ]"
          :key="f.label"
          :class="['filter-btn', { active: activeFilter === f.value }]"
          @click="setFilter(f.value)"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="tag-row">
        <button
          :class="['tag-btn', { active: activeTag === null }]"
          @click="setTag(null)"
        >
          {{ t('filters.all') }}
        </button>
        <button
          v-for="tag in allTags"
          :key="tag"
          :class="['tag-btn', { active: activeTag === tag }]"
          @click="setTag(tag)"
        >
          {{ t(`tags.${tag}`) }}
        </button>
      </div>

      <div class="question-list">
        <a
          v-for="q in visibleQuestions"
          :key="q.url"
          :href="q.url"
          class="question-card"
        >
          <div class="question-content">
            <span class="question-title">{{ q.title }}</span>
            <div class="question-tags">
              <span v-for="tag in q.tags" :key="tag" class="tag-badge">
                {{ t(`tags.${tag}`) }}
              </span>
            </div>
          </div>
          <span :class="['difficulty-badge', difficultyClass[q.difficulty]]">
            {{ t(`filters.${q.difficulty}`) }}
          </span>
        </a>
      </div>

      <button v-if="hasMore" class="show-more-btn" @click="showMore">
        {{ t('home.showMore', { remaining: filteredQuestions.length - visibleCount }) }}
      </button>

      <p v-if="filteredQuestions.length === 0" class="no-results">
        {{ t('home.noResults') }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem;
}

.search-wrapper {
  max-width: 500px;
  margin: 0 auto 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.content {
  margin-top: 1rem;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.filter-btn.active {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand-1);
}

.tag-row {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tag-btn {
  padding: 0.25rem 0.625rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8125rem;
  cursor: pointer;
  background: transparent;
  color: var(--vp-c-text-3);
  transition: all 0.2s;
}

.tag-btn:hover {
  color: var(--vp-c-text-1);
}

.tag-btn.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.question-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  text-decoration: none;
  transition: border-color 0.2s;
}

.question-card:hover {
  border-color: var(--vp-c-brand-1);
}

.question-content {
  min-width: 0;
}

.question-title {
  color: var(--vp-c-text-1);
  font-size: 0.9375rem;
  font-weight: 500;
  display: block;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.375rem;
}

.tag-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  border: 1px solid var(--vp-c-border);
}

.difficulty-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
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

.show-more-btn {
  display: block;
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.show-more-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.no-results {
  text-align: center;
  color: var(--vp-c-text-3);
  padding: 3rem 0;
}

@media (max-width: 640px) {
  .question-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
