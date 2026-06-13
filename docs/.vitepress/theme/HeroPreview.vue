<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from 'vitepress'
import { useI18n } from './i18n'
import { capture } from './analytics'

const { lang } = useData()
const { t } = useI18n()

const revealed = ref(false)
const answerResult = ref<'got-it' | 'review' | null>(null)

const flashcardsUrl = computed(() =>
  lang.value === 'es' ? '/es/flashcards' : '/flashcards'
)

const question = computed(() => {
  if (lang.value === 'es') {
    return {
      title: '¿Cuál es la diferencia entre ref y reactive?',
      difficulty: 'beginner',
      tags: ['reactivity', 'composition-api'],
      summary:
        'ref funciona con cualquier tipo y requiere .value. reactive solo con objetos, sin .value, pero no se puede reasignar ni destructurar de forma segura.',
      url: '/es/q/ref-vs-reactive'
    }
  }
  return {
    title: "What's the difference between ref and reactive?",
    difficulty: 'beginner',
    tags: ['reactivity', 'composition-api'],
    summary:
      "ref works with any value type and requires .value access. reactive works only with objects, no .value needed, but can't be reassigned or destructured safely.",
    url: '/q/ref-vs-reactive'
  }
})

function doReveal() {
  revealed.value = true
  capture('hero_preview_revealed')
}

function answer(result: 'got-it' | 'review') {
  answerResult.value = result
  capture('hero_preview_answered', { result })
}
</script>

<template>
  <div class="hero-preview">
    <p class="preview-label">{{ t('hero.previewLabel') }}</p>

    <div class="card-wrapper">
      <div class="card-flipper" :class="{ flipped: revealed }">
        <!-- Front -->
        <div class="card card-face-front">
          <span class="difficulty-badge badge-beginner">
            {{ t('filters.beginner') }}
          </span>
          <h3 class="card-title">{{ question.title }}</h3>
          <div class="card-tags">
            <span v-for="tag in question.tags" :key="tag" class="tag-badge">
              {{ t(`tags.${tag}`) }}
            </span>
          </div>
          <button class="reveal-btn" @click="doReveal">
            {{ t('hero.revealAnswer') }}
          </button>
          <p class="reveal-hint">{{ t('flashcards.revealHint') }}</p>
        </div>

        <!-- Back -->
        <div class="card card-face-back">
          <template v-if="!answerResult">
            <p class="card-excerpt">{{ question.summary }}</p>
            <p class="self-assess-label">{{ t('flashcards.selfAssess') }}</p>
            <div class="answer-buttons">
              <button class="answer-btn review" @click="answer('review')">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                {{ t('flashcards.reviewAgain') }}
              </button>
              <button class="answer-btn got-it" @click="answer('got-it')">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7L6 10L11 4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ t('flashcards.gotIt') }}
              </button>
            </div>
          </template>

          <template v-else-if="answerResult === 'review'">
            <p class="card-excerpt">{{ question.summary }}</p>
            <a :href="question.url" class="try-flashcards-btn">
              {{ t('hero.readMore') }} →
            </a>
          </template>

          <template v-else>
            <p class="cta-message">{{ t('hero.ctaMessage') }}</p>
            <a :href="flashcardsUrl" class="try-flashcards-btn">
              {{ t('flashcards.title') }} →
            </a>
          </template>
        </div>
      </div>

      <!-- Swipe indicators (visible after flip) -->
      <div
        v-if="revealed && !answerResult"
        class="swipe-indicator swipe-indicator-left"
        @click="answer('review')"
      >
        ✗
      </div>
      <div
        v-if="revealed && !answerResult"
        class="swipe-indicator swipe-indicator-right"
        @click="answer('got-it')"
      >
        ✓
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-preview {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  text-align: center;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--vp-c-text-3);
  margin-bottom: 1rem;
}

/* Card flip container */
.card-wrapper {
  max-width: 560px;
  margin: 0 auto;
  perspective: 800px;
  position: relative;
}

.card-flipper {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.card-flipper.flipped {
  transform: rotateY(180deg);
}

.card {
  grid-area: 1 / 1;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg);
  padding: 2rem;
  text-align: center;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  backface-visibility: hidden;
  transition: box-shadow 0.3s;
}

.card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.card-face-back {
  transform: rotateY(180deg);
}

.card-flipper:not(.flipped) .card-face-back {
  pointer-events: none;
}

.card-flipper.flipped .card-face-front {
  pointer-events: none;
}

/* Card content */
.difficulty-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.badge-beginner {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-1);
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

/* Back face */
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
  width: 100%;
  box-sizing: border-box;
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

.cta-message {
  font-size: 1.0625rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0;
  line-height: 1.5;
}

.try-flashcards-btn {
  display: inline-block;
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  text-decoration: none;
  transition: opacity 0.2s;
}

.try-flashcards-btn:hover {
  opacity: 0.9;
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

/* Swipe indicators */
.swipe-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  font-weight: 700;
  opacity: 0.35;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
}

.swipe-indicator:hover {
  opacity: 0.8;
  transform: translateY(-50%) scale(1.1);
}

.swipe-indicator-left {
  left: -18px;
  color: var(--vp-c-red-2);
  background: var(--vp-c-red-soft);
}

.swipe-indicator-right {
  right: -18px;
  color: var(--vp-c-green-2);
  background: var(--vp-c-green-soft);
}

@media (max-width: 640px) {
  .swipe-indicator-left {
    left: -8px;
  }
  .swipe-indicator-right {
    right: -8px;
  }

  .answer-buttons {
    flex-direction: column;
    width: 100%;
  }

  .answer-btn {
    justify-content: center;
  }
}
</style>
