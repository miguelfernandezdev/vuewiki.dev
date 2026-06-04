<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import { capture } from './analytics'
import Fuse from 'fuse.js'
import { data as allQuestions } from './questions.data'
import { useI18n } from './i18n'
import { useReadTracker } from './useReadTracker'
import FooterCta from './FooterCta.vue'

const { lang } = useData()
const { t } = useI18n()
const { readCount, isRead } = useReadTracker()

const questions = computed(() =>
  allQuestions.filter((q) => q.locale === lang.value)
)

const PAGE_SIZE = 30
const visibleCount = ref(PAGE_SIZE)
const search = ref('')
const activeFilter = ref<string | null>(null)
const activeTags = ref<Set<string>>(new Set())

const TECHNOLOGY_TAGS = new Set([
  'nuxt',
  'typescript',
  'vue-router',
  'pinia',
  'vite',
  'vitest',
  'vueuse',
  'vuex'
])

const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2
}

type SortKey = 'recommended' | 'easiest' | 'hardest'
const VALID_SORTS = new Set<SortKey>(['recommended', 'easiest', 'hardest'])
const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced'])
const activeSort = ref<SortKey>('recommended')
const sortDropdownOpen = ref(false)
const sortDropdownRef = ref<HTMLElement | null>(null)

function readUrlParams() {
  const params = new URLSearchParams(globalThis.location.search)

  const diff = params.get('difficulty')
  if (diff && VALID_DIFFICULTIES.has(diff)) activeFilter.value = diff

  const tags = params.get('tags')
  if (tags) activeTags.value = new Set(tags.split(',').filter(Boolean))

  const sort = params.get('sort') as SortKey
  if (sort && VALID_SORTS.has(sort)) activeSort.value = sort

  const q = params.get('q')
  if (q) search.value = q
}

function syncUrlParams() {
  const params = new URLSearchParams()

  if (activeFilter.value) params.set('difficulty', activeFilter.value)
  if (activeTags.value.size > 0)
    params.set('tags', [...activeTags.value].join(','))
  if (activeSort.value !== 'recommended') params.set('sort', activeSort.value)
  if (search.value) params.set('q', search.value)

  const qs = params.toString()
  const url = globalThis.location.pathname + (qs ? `?${qs}` : '')
  globalThis.history.replaceState(null, '', url)
}

function toggleSortDropdown() {
  sortDropdownOpen.value = !sortDropdownOpen.value
}

function setSort(key: SortKey) {
  activeSort.value = key
  sortDropdownOpen.value = false
  visibleCount.value = PAGE_SIZE
  capture('sort_order_changed', { sort: key })
}

const difficultyFilteredQuestions = computed(() => {
  if (!activeFilter.value) return questions.value
  return questions.value.filter((q) => q.difficulty === activeFilter.value)
})

const tagFilteredQuestions = computed(() => {
  if (activeTags.value.size === 0) return questions.value
  return questions.value.filter((q) =>
    q.tags.some((tag) => activeTags.value.has(tag))
  )
})

const tagCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const q of difficultyFilteredQuestions.value) {
    for (const tag of q.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return counts
})

const difficultyCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const q of tagFilteredQuestions.value) {
    counts[q.difficulty] = (counts[q.difficulty] ?? 0) + 1
  }
  return counts
})

const allTags = computed(() => {
  const tags = new Set<string>()
  questions.value.forEach((q) => q.tags.forEach((tag) => tags.add(tag)))
  const counts = tagCounts.value
  return Array.from(tags).sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0)
  )
})

const groupedTags = computed(() => {
  const topics: string[] = []
  const technologies: string[] = []
  for (const tag of allTags.value) {
    if (TECHNOLOGY_TAGS.has(tag)) {
      technologies.push(tag)
    } else {
      topics.push(tag)
    }
  }
  return { topics, technologies }
})

const topicDropdownOpen = ref(false)
const topicSearch = ref('')
const dropdownRef = ref<HTMLElement | null>(null)

const filteredTopics = computed(() => {
  if (!topicSearch.value) return groupedTags.value.topics
  const q = topicSearch.value.toLowerCase()
  return groupedTags.value.topics.filter(
    (tag) =>
      t(`tags.${tag}`).toLowerCase().includes(q) ||
      tag.toLowerCase().includes(q)
  )
})

const techDropdownOpen = ref(false)
const techSearch = ref('')
const techDropdownRef = ref<HTMLElement | null>(null)

const filteredTech = computed(() => {
  if (!techSearch.value) return groupedTags.value.technologies
  const q = techSearch.value.toLowerCase()
  return groupedTags.value.technologies.filter(
    (tag) =>
      t(`tags.${tag}`).toLowerCase().includes(q) ||
      tag.toLowerCase().includes(q)
  )
})

function toggleTechDropdown() {
  techDropdownOpen.value = !techDropdownOpen.value
  if (techDropdownOpen.value) {
    techSearch.value = ''
  }
}

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
  if (
    techDropdownRef.value &&
    !techDropdownRef.value.contains(e.target as Node)
  ) {
    techDropdownOpen.value = false
  }
  if (
    sortDropdownRef.value &&
    !sortDropdownRef.value.contains(e.target as Node)
  ) {
    sortDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  readUrlParams()
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))

watch([search, activeFilter, activeTags, activeSort], () => syncUrlParams(), {
  deep: true
})

const fuse = computed(
  () =>
    new Fuse(questions.value, {
      keys: ['title'],
      threshold: 0.4,
      includeMatches: true
    })
)

const fuseResults = computed(() => {
  if (!search.value) return null
  return fuse.value.search(search.value)
})

const filteredQuestions = computed(() => {
  let results: {
    title: string
    url: string
    difficulty: string
    tags: string[]
    order: number
    highlights?: [number, number][]
  }[]

  if (fuseResults.value) {
    results = fuseResults.value.map((r) => ({
      ...r.item,
      highlights: r.matches?.[0]?.indices as [number, number][] | undefined
    }))
  } else {
    results = questions.value.map((q) => ({ ...q, highlights: undefined }))
  }

  const filtered = results.filter((q) => {
    const matchesFilter =
      !activeFilter.value || q.difficulty === activeFilter.value
    const matchesTag =
      activeTags.value.size === 0 ||
      q.tags.some((tag) => activeTags.value.has(tag))
    return matchesFilter && matchesTag
  })

  if (fuseResults.value) return filtered

  if (activeSort.value === 'easiest') {
    return filtered.sort(
      (a, b) =>
        (DIFFICULTY_ORDER[a.difficulty] ?? 0) -
          (DIFFICULTY_ORDER[b.difficulty] ?? 0) || a.order - b.order
    )
  }
  if (activeSort.value === 'hardest') {
    return filtered.sort(
      (a, b) =>
        (DIFFICULTY_ORDER[b.difficulty] ?? 0) -
          (DIFFICULTY_ORDER[a.difficulty] ?? 0) || a.order - b.order
    )
  }
  return filtered
})

function highlightTitle(title: string, indices?: [number, number][]) {
  if (!indices || !search.value) return title
  const sorted = [...indices].sort((a, b) => a[0] - b[0])
  let result = ''
  let last = 0
  for (const [start, end] of sorted) {
    result += title.slice(last, start)
    result += `<mark>${title.slice(start, end + 1)}</mark>`
    last = end + 1
  }
  result += title.slice(last)
  return result
}

const visibleQuestions = computed(() =>
  filteredQuestions.value.slice(0, visibleCount.value)
)

const hasMore = computed(
  () => visibleCount.value < filteredQuestions.value.length
)

function showMore() {
  capture('show_more_clicked', { visible_count: visibleCount.value })
  visibleCount.value += PAGE_SIZE
}

function setFilter(value: string | null) {
  activeFilter.value = value
  visibleCount.value = PAGE_SIZE
  capture('difficulty_filter_applied', { filter: value ?? 'all' })
}

function toggleTag(tag: string) {
  const next = new Set(activeTags.value)
  if (next.has(tag)) {
    next.delete(tag)
  } else {
    next.add(tag)
    capture('tag_filter_applied', { tag, active_tag_count: next.size })
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
  advanced: 'badge-advanced'
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (value) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (!value) return
  searchDebounceTimer = setTimeout(() => {
    capture('question_searched', {
      query: value,
      result_count: filteredQuestions.value.length
    })
  }, 800)
})
</script>

<template>
  <div class="home-page">
    <div class="search-wrapper">
      <svg
        class="search-icon"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
      >
        <circle
          cx="7.5"
          cy="7.5"
          r="5.75"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M12 12L16 16"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      <input
        v-model="search"
        type="text"
        :placeholder="t('home.searchPlaceholder')"
        class="search-input"
      />
      <button v-if="search" class="search-clear" @click="search = ''">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <section class="content">
      <div class="progress-bar-wrapper">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: questions.length
                ? `${(readCount / questions.length) * 100}%`
                : '0%'
            }"
          />
        </div>
        <span class="progress-label"
          >{{ readCount }}/{{ questions.length }}</span
        >
      </div>

      <div class="filters">
        <div class="filter-row">
          <button
            v-for="f in [
              { label: t('filters.all'), value: null, count: questions.length },
              {
                label: t('filters.beginner'),
                value: 'beginner',
                count: difficultyCounts['beginner'] ?? 0
              },
              {
                label: t('filters.intermediate'),
                value: 'intermediate',
                count: difficultyCounts['intermediate'] ?? 0
              },
              {
                label: t('filters.advanced'),
                value: 'advanced',
                count: difficultyCounts['advanced'] ?? 0
              }
            ]"
            :key="f.label"
            :class="[
              'filter-btn',
              { active: activeFilter === f.value },
              f.value ? `filter-${f.value}` : ''
            ]"
            @click="setFilter(f.value)"
          >
            {{ f.label }} ({{ f.count }})
          </button>
        </div>

        <div ref="dropdownRef" class="topic-dropdown">
          <button class="dropdown-trigger" @click="toggleDropdown">
            <span>{{ t('tags.topicsGroup') }}</span>
            <span
              v-if="
                activeTags.size > 0 &&
                [...activeTags].some((t) => !TECHNOLOGY_TAGS.has(t))
              "
              class="trigger-count"
              >{{
                [...activeTags].filter((t) => !TECHNOLOGY_TAGS.has(t)).length
              }}</span
            >
            <svg
              class="dropdown-chevron"
              :class="{ open: topicDropdownOpen }"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
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
              <li v-for="tag in filteredTopics" :key="tag">
                <button
                  :class="['dropdown-option', { active: activeTags.has(tag) }]"
                  @click="toggleTag(tag)"
                >
                  <svg
                    v-if="activeTags.has(tag)"
                    class="check-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>{{ t(`tags.${tag}`) }}</span>
                  <span class="tag-count">({{ tagCounts.get(tag) ?? 0 }})</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div ref="techDropdownRef" class="topic-dropdown">
          <button class="dropdown-trigger" @click="toggleTechDropdown">
            <span>{{ t('tags.techGroup') }}</span>
            <span
              v-if="[...activeTags].some((t) => TECHNOLOGY_TAGS.has(t))"
              class="trigger-count"
              >{{
                [...activeTags].filter((t) => TECHNOLOGY_TAGS.has(t)).length
              }}</span
            >
            <svg
              class="dropdown-chevron"
              :class="{ open: techDropdownOpen }"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div v-show="techDropdownOpen" class="dropdown-panel">
            <input
              v-model="techSearch"
              type="text"
              class="dropdown-search"
              :placeholder="t('tags.searchTopics')"
            />
            <ul class="dropdown-list">
              <li v-for="tag in filteredTech" :key="tag">
                <button
                  :class="['dropdown-option', { active: activeTags.has(tag) }]"
                  @click="toggleTag(tag)"
                >
                  <svg
                    v-if="activeTags.has(tag)"
                    class="check-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>{{ t(`tags.${tag}`) }}</span>
                  <span class="tag-count">({{ tagCounts.get(tag) ?? 0 }})</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div ref="sortDropdownRef" class="topic-dropdown">
          <button class="dropdown-trigger" @click="toggleSortDropdown">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 4H12M4 7H10M6 10H8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <span>{{ t(`sort.${activeSort}`) }}</span>
            <svg
              class="dropdown-chevron"
              :class="{ open: sortDropdownOpen }"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div v-show="sortDropdownOpen" class="dropdown-panel">
            <ul class="dropdown-list">
              <li
                v-for="key in ['recommended', 'easiest', 'hardest'] as const"
                :key="key"
              >
                <button
                  :class="['dropdown-option', { active: activeSort === key }]"
                  @click="setSort(key)"
                >
                  <svg
                    v-if="activeSort === key"
                    class="check-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>{{ t(`sort.${key}`) }}</span>
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
              <path
                d="M3 3L9 9M9 3L3 9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
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
          :class="[
            'question-card',
            `card-${q.difficulty}`,
            { 'is-read': isRead(q.url) }
          ]"
        >
          <div class="question-content">
            <div class="question-title-row">
              <span :class="['read-check', { read: isRead(q.url) }]">
                <svg
                  v-if="isRead(q.url)"
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M3 7L6 10L11 4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span
                class="question-title"
                v-html="highlightTitle(q.title, q.highlights)"
              />
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
        {{
          t('home.showMore', {
            remaining: filteredQuestions.length - visibleCount
          })
        }}
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
  position: relative;
  margin-bottom: 1.5rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--vp-c-text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.875rem 2.75rem 0.875rem 2.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: all 0.15s;
}

.search-clear:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
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
  color: var(--vp-c-text-2);
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
  background: #247f53;
  color: var(--vp-c-white);
  border-color: #247f53;
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
  background: #247f53;
  border-color: #247f53;
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
  background: #8a6d2e;
  border-color: #8a6d2e;
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
  background: #b54248;
  border-color: #b54248;
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

.trigger-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: #247f53;
  color: var(--vp-c-white);
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

.tag-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  font-weight: 400;
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

.question-title :deep(mark) {
  background: var(--vp-c-yellow-soft);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
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
  color: var(--vp-c-green-1);
}

.badge-intermediate {
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-1);
}

.badge-advanced {
  background: var(--vp-c-red-soft);
  color: var(--vp-c-red-1);
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
