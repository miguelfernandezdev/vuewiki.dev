import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import { initAnalytics, captureException } from './analytics'
import HomePage from './HomePage.vue'
import QuestionsPage from './QuestionsPage.vue'
import FlashcardsPage from './FlashcardsPage.vue'
import QuestionMeta from './QuestionMeta.vue'
import BookLogo from './BookLogo.vue'
import FooterCta from './FooterCta.vue'
import QuizSection from './QuizSection.vue'
import TranslationBanner from './TranslationBanner.vue'
import PlaygroundLink from './PlaygroundLink.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => [h(TranslationBanner), h(QuestionMeta)],
      'doc-after': () => [h(QuizSection), h(FooterCta)],
      'home-hero-image': () => h(BookLogo)
    })
  },
  enhanceApp({ app }) {
    initAnalytics()

    app.config.errorHandler = (err) => {
      captureException(err)
    }

    app.component('HomePage', HomePage)
    app.component('QuestionsPage', QuestionsPage)
    app.component('FlashcardsPage', FlashcardsPage)
    app.component('PlaygroundLink', PlaygroundLink)
  }
} satisfies Theme
