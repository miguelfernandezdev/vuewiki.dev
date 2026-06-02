<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import { data as allQuestions } from './questions.data'
import { useI18n } from './i18n'
import { useReadTracker } from './useReadTracker'
import FooterCta from './FooterCta.vue'

const { lang } = useData()
const { t } = useI18n()
const { readCount, isRead } = useReadTracker()

const questions = computed(() =>
  allQuestions.filter(q => q.locale === lang.value),
)

const search = ref('')
const activeFilter = ref<string | null>(null)
const activeTags = ref<Set<string>>(new Set())

const allTags = computed(() => {
  const tags = new Set<string>()
  questions.value.forEach(q => q.tags.forEach(tag => tags.add(tag)))
  return Array.from(tags).sort()
})

const topicDropdownOpen = ref(false)
const topicSearch = ref('')
const dropdownRef = ref<HTMLElement | null>(null)

const filteredTags = computed(() => {
  if (!topicSearch.value) return allTags.value
  const q = topicSearch.value.toLowerCase()
  return allTags.value.filter(tag =>
    t(`tags.${tag}`).toLowerCase().includes(q) || tag.toLowerCase().includes(q),
  )
})

function toggleDropdown() {
  topicDropdownOpen.value = !topicDropdownOpen.value
  if (topicDropdownOpen.value) {
    topicSearch.value = ''
  }
}

function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    topicDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(search.value.toLowerCase())
    const matchesFilter = !activeFilter.value || q.difficulty === activeFilter.value
    const matchesTag = activeTags.value.size === 0 || q.tags.some(tag => activeTags.value.has(tag))
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

function setFilter(value: string | null) {
  activeFilter.value = value
  visibleCount.value = PAGE_SIZE
}

function toggleTag(tag: string) {
  const next = new Set(activeTags.value)
  if (next.has(tag)) {
    next.delete(tag)
  } else {
    next.add(tag)
  }
  activeTags.value = next
  visibleCount.value = PAGE_SIZE
}

function removeTag(tag: string) {
  const next = new Set(activeTags.value)
  next.delete(tag)
  activeTags.value = next
  visibleCount.value = PAGE_SIZE
}

function clearTags() {
  activeTags.value = new Set()
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
      <div class="progress-bar-wrapper">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: questions.length ? `${(readCount / questions.length) * 100}%` : '0%' }"
          />
        </div>
        <span class="progress-label">{{ readCount }}/{{ questions.length }}</span>
      </div>

      <div class="filters">
        <div class="filter-row">
          <button
            v-for="f in [
              { label: t('filters.all'), value: null },
              { label: t('filters.beginner'), value: 'beginner' },
              { label: t('filters.intermediate'), value: 'intermediate' },
              { label: t('filters.advanced'), value: 'advanced' },
            ]"
            :key="f.label"
            :class="['filter-btn', { active: activeFilter === f.value }, f.value ? `filter-${f.value}` : '']"
            @click="setFilter(f.value)"
          >
            {{ f.label }}
          </button>
        </div>

        <div ref="dropdownRef" class="topic-dropdown">
          <button class="dropdown-trigger" @click="toggleDropdown">
            <span>{{ activeTags.size === 0 ? t('tags.allTopics') : t('tags.label') + ` (${activeTags.size})` }}</span>
            <svg class="dropdown-chevron" :class="{ open: topicDropdownOpen }" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-show="topicDropdownOpen" class="dropdown-panel">
            <input
              v-model="topicSearch"
              type="text"
              class="dropdown-search"
              :placeholder="t('tags.searchTopics')"
            />
            <ul class="dropdown-list">
              <li v-for="tag in filteredTags" :key="tag">
                <button
                  :class="['dropdown-option', { active: activeTags.has(tag) }]"
                  @click="toggleTag(tag)"
                >
                  <svg v-if="activeTags.has(tag)" class="check-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{{ t(`tags.${tag}`) }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div v-if="activeTags.size > 0" class="selected-tags">
          <button
            v-for="tag in activeTags"
            :key="tag"
            class="selected-tag"
            @click="removeTag(tag)"
          >
            {{ t(`tags.${tag}`) }}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="clear-tags" @click="clearTags">
            {{ t('tags.clear') }}
          </button>
        </div>
      </div>

      <div class="question-list">
        <a
          v-for="q in visibleQuestions"
          :key="q.url"
          :href="q.url"
          :class="['question-card', `card-${q.difficulty}`, { 'is-read': isRead(q.url) }]"
        >
          <div class="question-content">
            <div class="question-title-row">
              <span :class="['read-check', { read: isRead(q.url) }]">
                <svg v-if="isRead(q.url)" width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="question-title">{{ q.title }}</span>
            </div>
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

    <FooterCta />
  </div>
</template>

<style scoped>
.home-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 2rem;
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

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--vp-c-green-2);
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
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

.filter-btn.filter-beginner {
  color: var(--vp-c-green-2);
  border-color: var(--vp-c-green-soft);
  background: var(--vp-c-bg);
}

.filter-btn.filter-beginner:hover {
  background: var(--vp-c-green-soft);
  border-color: var(--vp-c-green-2);
}

.filter-btn.filter-beginner.active {
  background: var(--vp-c-green-2);
  border-color: var(--vp-c-green-2);
  color: var(--vp-c-white);
}

.filter-btn.filter-intermediate {
  color: var(--vp-c-yellow-2);
  border-color: var(--vp-c-yellow-soft);
  background: var(--vp-c-bg);
}

.filter-btn.filter-intermediate:hover {
  background: var(--vp-c-yellow-soft);
  border-color: var(--vp-c-yellow-2);
}

.filter-btn.filter-intermediate.active {
  background: var(--vp-c-yellow-2);
  border-color: var(--vp-c-yellow-2);
  color: var(--vp-c-white);
}

.filter-btn.filter-advanced {
  color: var(--vp-c-red-2);
  border-color: var(--vp-c-red-soft);
  background: var(--vp-c-bg);
}

.filter-btn.filter-advanced:hover {
  background: var(--vp-c-red-soft);
  border-color: var(--vp-c-red-2);
}

.filter-btn.filter-advanced.active {
  background: var(--vp-c-red-2);
  border-color: var(--vp-c-red-2);
  color: var(--vp-c-white);
}

.topic-dropdown {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  transition: all 0.2s;
  white-space: nowrap;
}

.dropdown-trigger:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.dropdown-chevron {
  transition: transform 0.2s;
}

.dropdown-chevron.open {
  transform: rotate(180deg);
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  min-width: 220px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.dropdown-search {
  padding: 0.5rem 0.75rem;
  border: none;
  border-bottom: 1px solid var(--vp-c-border);
  border-radius: 8px 8px 0 0;
  font-size: 0.8125rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  outline: none;
}

.dropdown-search::placeholder {
  color: var(--vp-c-text-3);
}

.dropdown-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.375rem 0.75rem;
  border: none;
  background: none;
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.dropdown-option:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.dropdown-option.active {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.check-icon {
  flex-shrink: 0;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  width: 100%;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  transition: opacity 0.15s;
}

.selected-tag:hover {
  opacity: 0.7;
}

.clear-tags {
  padding: 0.1875rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  background: none;
  color: var(--vp-c-text-3);
  transition: color 0.15s;
}

.clear-tags:hover {
  color: var(--vp-c-text-1);
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
  border-left: 3px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  text-decoration: none;
  transition: all 0.2s;
}

.question-card:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-border);
}

.card-beginner {
  border-left-color: var(--vp-c-green-2);
}

.card-intermediate {
  border-left-color: var(--vp-c-yellow-2);
}

.card-advanced {
  border-left-color: var(--vp-c-red-2);
}

.card-beginner:hover {
  border-left-color: var(--vp-c-green-2);
}

.card-intermediate:hover {
  border-left-color: var(--vp-c-yellow-2);
}

.card-advanced:hover {
  border-left-color: var(--vp-c-red-2);
}

.question-content {
  min-width: 0;
}

.question-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.question-card.is-read .question-title {
  color: var(--vp-c-text-3);
}

.question-title {
  color: var(--vp-c-text-1);
  font-size: 0.9375rem;
  font-weight: 500;
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
  color: var(--vp-c-text-2);
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
