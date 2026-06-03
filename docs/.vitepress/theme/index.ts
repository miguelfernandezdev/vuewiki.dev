import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import HomePage from './HomePage.vue'
import QuestionsPage from './QuestionsPage.vue'
import FlashcardsPage from './FlashcardsPage.vue'
import QuestionMeta from './QuestionMeta.vue'
import BookLogo from './BookLogo.vue'
import FooterCta from './FooterCta.vue'
import QuizSection from './QuizSection.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(QuestionMeta),
      'doc-after': () => [h(QuizSection), h(FooterCta)],
      'home-hero-image': () => h(BookLogo),
    })
  },
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('QuestionsPage', QuestionsPage)
    app.component('FlashcardsPage', FlashcardsPage)
  },
} satisfies Theme
