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

type Phase = 'setup' | 'active' | 'complete'
type Result = 'got-it' | 'review'

const phase = ref<Phase>('setup')
const difficultyFilter = ref<string | null>(null)
const currentIndex = ref(0)
const revealed = ref(false)
const results = ref<Map<string, Result>>(new Map())
const deck = ref<typeof questions.value>([])

const filteredQuestions = computed(() => {
  if (!difficultyFilter.value) return questions.value
  return questions.value.filter(q => q.difficulty === difficultyFilter.value)
})

const difficultyOptions = computed(() => {
  const counts: Record<string, number> = {}
  for (const q of questions.value) {
    counts[q.difficulty] = (counts[q.difficulty] ?? 0) + 1
  }
  return [
    { value: null, count: questions.value.length },
    { value: 'beginner', count: counts.beginner ?? 0 },
    { value: 'intermediate', count: counts.intermediate ?? 0 },
    { value: 'advanced', count: counts.advanced ?? 0 },
  ]
})

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function startDeck(reviewOnly = false) {
  if (reviewOnly) {
    const reviewUrls = new Set(
      [...results.value.entries()].filter(([, r]) => r === 'review').map(([url]) => url),
    )
    deck.value = shuffle(deck.value.filter(q => reviewUrls.has(q.url)))
  } else {
    deck.value = shuffle(filteredQuestions.value)
  }
  results.value = new Map()
  currentIndex.value = 0
  revealed.value = false
  phase.value = 'active'
}

const currentCard = computed(() => deck.value[currentIndex.value])

const progress = computed(() => ({
  current: currentIndex.value + 1,
  total: deck.value.length,
  gotIt: [...results.value.values()].filter(r => r === 'got-it').length,
  review: [...results.value.values()].filter(r => r === 'review').length,
}))

function reveal() {
  revealed.value = true
}

function answer(result: Result) {
  results.value.set(currentCard.value.url, result)
  if (currentIndex.value < deck.value.length - 1) {
    currentIndex.value++
    revealed.value = false
  } else {
    phase.value = 'complete'
  }
}

function backToSetup() {
  phase.value = 'setup'
  difficultyFilter.value = null
}

const homeBase = computed(() => lang.value === 'es' ? '/es/' : '/')

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
}
</script>

<template>
  <div class="flashcards-page">
    <!-- Setup -->
    <div v-if="phase === 'setup'" class="setup">
      <h1>{{ t('flashcards.title') }}</h1>
      <p class="setup-desc">{{ t('flashcards.description') }}</p>

      <div class="difficulty-picker">
        <button
          v-for="opt in difficultyOptions"
          :key="opt.value ?? 'all'"
          :class="['pick-btn', { active: difficultyFilter === opt.value }, opt.value ? `pick-${opt.value}` : '']"
          @click="difficultyFilter = opt.value"
        >
          {{ opt.value ? t(`filters.${opt.value}`) : t('filters.all') }}
          <span class="pick-count">({{ opt.count }})</span>
        </button>
      </div>

      <button class="start-btn" @click="startDeck()">
        {{ t('flashcards.start', { count: filteredQuestions.length }) }}
      </button>
    </div>

    <!-- Active card -->
    <div v-else-if="phase === 'active'" class="active">
      <div class="card-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(progress.current / progress.total) * 100}%` }" />
        </div>
        <span class="progress-text">{{ progress.current }} / {{ progress.total }}</span>
      </div>

      <div class="card" :class="{ revealed }">
        <div class="card-front">
          <span :class="['difficulty-badge', difficultyClass[currentCard.difficulty]]">
            {{ t(`filters.${currentCard.difficulty}`) }}
          </span>
          <h2 class="card-title">{{ currentCard.title }}</h2>
          <div class="card-tags">
            <span v-for="tag in currentCard.tags" :key="tag" class="tag-badge">
              {{ t(`tags.${tag}`) }}
            </span>
          </div>
        </div>

        <div v-if="!revealed" class="card-action">
          <button class="reveal-btn" @click="reveal">
            {{ t('flashcards.reveal') }}
          </button>
          <p class="reveal-hint">{{ t('flashcards.revealHint') }}</p>
        </div>

        <div v-else class="card-back">
          <p v-if="currentCard.summary" class="card-excerpt">{{ currentCard.summary }}</p>
          <p class="self-assess-label">{{ t('flashcards.selfAssess') }}</p>
          <div class="answer-buttons">
            <button class="answer-btn got-it" @click="answer('got-it')">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ t('flashcards.gotIt') }}
            </button>
            <button class="answer-btn review" @click="answer('review')">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              {{ t('flashcards.reviewAgain') }}
            </button>
          </div>
          <a :href="currentCard.url" class="full-answer-link">
            {{ t('flashcards.seeAnswer') }} →
          </a>
        </div>
      </div>

      <div class="card-stats">
        <span class="stat got-it">✓ {{ progress.gotIt }}</span>
        <span class="stat review">✗ {{ progress.review }}</span>
      </div>
    </div>

    <!-- Complete -->
    <div v-else class="complete">
      <h2>{{ t('flashcards.completeTitle') }}</h2>

      <div class="score-ring">
        <svg viewBox="0 0 100 100" width="140" height="140">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--vp-c-bg-soft)" stroke-width="8" />
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="var(--vp-c-green-2)"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="`${(progress.gotIt / progress.total) * 264} 264`"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div class="score-text">
          <span class="score-number">{{ Math.round((progress.gotIt / progress.total) * 100) }}%</span>
        </div>
      </div>

      <div class="score-details">
        <span class="stat got-it">✓ {{ t('flashcards.gotItCount', { count: progress.gotIt }) }}</span>
        <span class="stat review">✗ {{ t('flashcards.reviewCount', { count: progress.review }) }}</span>
      </div>

      <div class="complete-actions">
        <button v-if="progress.review > 0" class="start-btn" @click="startDeck(true)">
          {{ t('flashcards.reviewPile', { count: progress.review }) }}
        </button>
        <button class="start-btn secondary" @click="startDeck()">
          {{ t('flashcards.restart') }}
        </button>
        <button class="back-btn" @click="backToSetup">
          {{ t('flashcards.backToSetup') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flashcards-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 2rem;
}

.setup {
  text-align: center;
}

.setup h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem;
}

.setup-desc {
  color: var(--vp-c-text-2);
  font-size: 0.9375rem;
  margin: 0 0 2rem;
}

.difficulty-picker {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.pick-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.pick-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.pick-btn.active {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand-1);
}

.pick-btn.pick-beginner.active {
  background: var(--vp-c-green-2);
  border-color: var(--vp-c-green-2);
}

.pick-btn.pick-intermediate.active {
  background: var(--vp-c-yellow-2);
  border-color: var(--vp-c-yellow-2);
}

.pick-btn.pick-advanced.active {
  background: var(--vp-c-red-2);
  border-color: var(--vp-c-red-2);
}

.pick-count {
  opacity: 0.7;
}

.start-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  transition: opacity 0.2s;
}

.start-btn:hover {
  opacity: 0.9;
}

.start-btn.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-border);
}

.start-btn.secondary:hover {
  border-color: var(--vp-c-brand-1);
}

/* Active phase */
.card-progress {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
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
  background: var(--vp-c-brand-1);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.card {
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg);
  padding: 2rem;
  text-align: center;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.card-front {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  margin: 0;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem;
}

.tag-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-border);
}

.card-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.reveal-btn {
  padding: 0.625rem 2rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: all 0.2s;
}

.reveal-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.reveal-hint {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin: 0;
}

.card-back {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.card-excerpt {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  text-align: left;
  margin: 0;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border-left: 3px solid var(--vp-c-brand-1);
}

.self-assess-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin: 0;
}

.answer-buttons {
  display: flex;
  gap: 0.75rem;
}

.answer-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--vp-c-bg);
  transition: all 0.2s;
}

.answer-btn.got-it {
  color: var(--vp-c-green-2);
  border-color: var(--vp-c-green-soft);
}

.answer-btn.got-it:hover {
  background: var(--vp-c-green-soft);
  border-color: var(--vp-c-green-2);
}

.answer-btn.review {
  color: var(--vp-c-red-2);
  border-color: var(--vp-c-red-soft);
}

.answer-btn.review:hover {
  background: var(--vp-c-red-soft);
  border-color: var(--vp-c-red-2);
}

.full-answer-link {
  font-size: 0.8125rem;
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color 0.15s;
}

.full-answer-link:hover {
  color: var(--vp-c-brand-1);
}

.card-stats {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.stat {
  font-size: 0.875rem;
  font-weight: 600;
}

.stat.got-it { color: var(--vp-c-green-2); }
.stat.review { color: var(--vp-c-red-2); }

/* Complete phase */
.complete {
  text-align: center;
}

.complete h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1.5rem;
}

.score-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.score-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.score-details {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.complete-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  background: none;
  color: var(--vp-c-text-3);
  transition: color 0.15s;
}

.back-btn:hover {
  color: var(--vp-c-text-1);
}

.difficulty-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
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
