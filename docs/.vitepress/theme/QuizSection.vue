<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import { capture } from './analytics'
import { useI18n } from './i18n'

interface QuizQuestion {
  question: string
  options: string[]
  answer: number
}

const { lang, frontmatter } = useData()
const route = useRoute()
const { t } = useI18n()

const isQuestion = computed(() => !!frontmatter.value.difficulty)

const phase = ref<'idle' | 'active' | 'complete'>('idle')
const questions = ref<QuizQuestion[]>([])
const currentIndex = ref(0)
const selected = ref<number | null>(null)
const answers = ref<(number | null)[]>([])
const loading = ref(false)
const hasQuiz = ref<boolean | null>(null)

const slug = computed(() => {
  const path = route.path
  const match = path.match(/\/q\/([^/]+?)(?:\.html)?$/)
  if (match) return match[1]
  const esMatch = path.match(/\/es\/q\/([^/]+?)(?:\.html)?$/)
  return esMatch ? esMatch[1] : null
})

const current = computed(() => questions.value[currentIndex.value])

const score = computed(
  () => answers.value.filter((a, i) => a === questions.value[i]?.answer).length
)

const scorePercent = computed(() =>
  questions.value.length
    ? Math.round((score.value / questions.value.length) * 100)
    : 0
)

async function loadQuiz() {
  if (!slug.value) return
  loading.value = true
  const prefix = lang.value === 'es' ? '/quiz/es/' : '/quiz/'
  try {
    const res = await fetch(`${prefix}${slug.value}.json`)
    if (!res.ok) {
      hasQuiz.value = false
      return
    }
    const data = await res.json()
    if (data.questions?.length) {
      questions.value = data.questions
      hasQuiz.value = true
    } else {
      hasQuiz.value = false
    }
  } catch {
    hasQuiz.value = false
  } finally {
    loading.value = false
  }
}

function start() {
  phase.value = 'active'
  currentIndex.value = 0
  selected.value = null
  answers.value = []
  capture('quiz_started', {
    question_slug: slug.value,
    question_count: questions.value.length,
    language: lang.value
  })
}

function selectOption(index: number) {
  if (selected.value !== null) return
  selected.value = index
  answers.value.push(index)
  setTimeout(() => {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
      selected.value = null
    } else {
      phase.value = 'complete'
      capture('quiz_completed', {
        question_slug: slug.value,
        question_count: questions.value.length,
        score: score.value,
        score_percent: scorePercent.value,
        language: lang.value
      })
    }
  }, 1500)
}

function retry() {
  start()
}

function backToIdle() {
  phase.value = 'idle'
  currentIndex.value = 0
  selected.value = null
  answers.value = []
}

watch(
  () => route.path,
  () => {
    phase.value = 'idle'
    questions.value = []
    hasQuiz.value = null
    currentIndex.value = 0
    selected.value = null
    answers.value = []
    if (isQuestion.value) loadQuiz()
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="isQuestion && hasQuiz" class="quiz-section">
    <!-- Idle -->
    <div v-if="phase === 'idle'" class="quiz-idle">
      <button class="quiz-start-btn" @click="start">
        🧠 {{ t('quiz.startBtn', { count: questions.length }) }}
      </button>
    </div>

    <!-- Active -->
    <div v-else-if="phase === 'active' && current" class="quiz-active">
      <div class="quiz-header">
        <span class="quiz-label">🧠 {{ t('quiz.title') }}</span>
        <div class="quiz-dots">
          <span
            v-for="(_, i) in questions"
            :key="i"
            :class="[
              'dot',
              {
                current: i === currentIndex,
                correct:
                  answers[i] != null && answers[i] === questions[i].answer,
                wrong: answers[i] != null && answers[i] !== questions[i].answer
              }
            ]"
          />
        </div>
      </div>

      <p class="quiz-question">{{ current.question }}</p>

      <div class="quiz-options">
        <button
          v-for="(option, i) in current.options"
          :key="i"
          :class="[
            'quiz-option',
            {
              selected: selected === i,
              correct: selected !== null && i === current.answer,
              wrong: selected === i && i !== current.answer,
              dimmed:
                selected !== null && i !== current.answer && selected !== i
            }
          ]"
          :disabled="selected !== null"
          @click="selectOption(i)"
        >
          <span class="option-letter">
            <svg
              v-if="selected !== null && i === current.answer"
              width="14"
              height="14"
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
            <svg
              v-else-if="selected === i && i !== current.answer"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M4 4L10 10M10 4L4 10"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <template v-else>{{ String.fromCharCode(65 + i) }}</template>
          </span>
          <span class="option-text">{{ option }}</span>
        </button>
      </div>
    </div>

    <!-- Complete -->
    <div v-else-if="phase === 'complete'" class="quiz-complete">
      <div class="quiz-header">
        <span class="quiz-label">🧠 {{ t('quiz.title') }}</span>
      </div>

      <div class="complete-body">
        <div class="score-ring">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--vp-c-border)"
              stroke-width="7"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              :stroke="
                scorePercent >= 50 ? 'var(--vp-c-green-2)' : 'var(--vp-c-red-2)'
              "
              stroke-width="7"
              stroke-linecap="round"
              :stroke-dasharray="`${scorePercent * 2.64} 264`"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="54"
              text-anchor="middle"
              font-size="22"
              font-weight="700"
              fill="var(--vp-c-text-1)"
            >
              {{ score }}/{{ questions.length }}
            </text>
          </svg>
        </div>

        <div class="complete-info">
          <p class="score-text">
            {{
              scorePercent >= 100
                ? t('quiz.perfect')
                : scorePercent >= 50
                  ? t('quiz.good')
                  : t('quiz.tryAgain')
            }}
          </p>
          <div class="score-breakdown">
            <span class="score-detail correct"
              >✓ {{ score }} {{ t('quiz.correctLabel') }}</span
            >
            <span class="score-detail wrong"
              >✗ {{ questions.length - score }} {{ t('quiz.wrongLabel') }}</span
            >
          </div>
          <div class="quiz-actions">
            <button class="quiz-btn retry" @click="retry">
              {{ t('quiz.retry') }}
            </button>
            <button class="quiz-btn back" @click="backToIdle">
              {{ t('quiz.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-section {
  max-width: 800px;
  margin: 2rem auto 0;
  padding: 0 1.5rem;
}

.quiz-idle {
  text-align: center;
}

.quiz-start-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px dashed var(--vp-c-brand-1);
  border-radius: 12px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.quiz-start-btn:hover {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border-style: solid;
}

.quiz-active,
.quiz-complete {
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.quiz-label {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
}

.quiz-dots {
  display: flex;
  gap: 0.375rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-border);
  transition: all 0.2s;
}

.dot.current {
  background: var(--vp-c-brand-1);
  transform: scale(1.25);
}

.dot.correct {
  background: var(--vp-c-green-2);
}

.dot.wrong {
  background: var(--vp-c-red-2);
}

.quiz-question {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.25s;
  text-align: left;
  width: 100%;
}

.quiz-option:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.quiz-option:disabled {
  cursor: default;
}

.quiz-option.correct {
  border-color: var(--vp-c-green-2);
  background: var(--vp-c-green-soft);
  animation: pop 0.3s ease;
}

.quiz-option.wrong {
  border-color: var(--vp-c-red-2);
  background: var(--vp-c-red-soft);
  animation: shake 0.4s ease;
}

.quiz-option.dimmed {
  opacity: 0.45;
}

@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(2px);
  }
}

.option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--vp-c-text-2);
  flex-shrink: 0;
  transition: all 0.25s;
}

.quiz-option.correct .option-letter {
  background: var(--vp-c-green-2);
  color: var(--vp-c-white);
}

.quiz-option.wrong .option-letter {
  background: var(--vp-c-red-2);
  color: var(--vp-c-white);
}

.option-text {
  font-size: 0.9375rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.quiz-complete {
  text-align: left;
}

.complete-body {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.score-ring {
  flex-shrink: 0;
}

.complete-info {
  flex: 1;
  min-width: 0;
}

.score-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem;
}

.score-breakdown {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.score-detail {
  font-size: 0.875rem;
  font-weight: 600;
}

.score-detail.correct {
  color: var(--vp-c-green-2);
}

.score-detail.wrong {
  color: var(--vp-c-red-2);
}

.quiz-actions {
  display: flex;
  gap: 0.75rem;
}

.quiz-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.quiz-btn.retry {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border: 1px solid var(--vp-c-brand-1);
}

.quiz-btn.retry:hover {
  opacity: 0.9;
}

.quiz-btn.back {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-border);
}

.quiz-btn.back:hover {
  border-color: var(--vp-c-text-2);
  color: var(--vp-c-text-1);
}
</style>
