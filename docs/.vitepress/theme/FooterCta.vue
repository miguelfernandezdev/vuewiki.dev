<script setup lang="ts">
import { capture } from './analytics'
import { useI18n } from './i18n'

const { t } = useI18n()

const repoUrl = 'https://github.com/miguelfernandezdev/vuewiki.dev'

function trackCta(type: 'suggest_question' | 'contribute') {
  capture('cta_clicked', { type })
}
</script>

<template>
  <div class="footer-cta">
    <a
      :href="`${repoUrl}/issues/new`"
      target="_blank"
      rel="noreferrer"
      class="cta-card"
      @click="trackCta('suggest_question')"
    >
      <div class="cta-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 3V17M3 10H17"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div class="cta-text">
        <span class="cta-title">{{ t('cta.missingTitle') }}</span>
        <span class="cta-desc">{{ t('cta.missingDesc') }}</span>
      </div>
      <span class="cta-action">{{ t('cta.missingAction') }}</span>
    </a>

    <div class="cta-bar">
      <a
        :href="`${repoUrl}/blob/main/CONTRIBUTING.md`"
        target="_blank"
        rel="noreferrer"
        class="contribute-link"
        @click="trackCta('contribute')"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
            fill="currentColor"
          />
        </svg>
        {{ t('cta.contribute') }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.footer-cta {
  max-width: 800px;
  margin: 3rem auto 0;
  padding: 0 1.5rem;
}

.cta-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--vp-c-brand-soft);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--vp-c-brand-soft), var(--vp-c-bg));
  text-decoration: none;
  transition: all 0.2s;
}

.cta-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.cta-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.cta-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}

.cta-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.cta-desc {
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
}

.cta-action {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

.cta-card:hover .cta-action {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.cta-bar {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.contribute-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: all 0.2s;
}

.contribute-link:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

@media (max-width: 640px) {
  .cta-card {
    flex-wrap: wrap;
  }

  .cta-action {
    display: none;
  }
}
</style>
