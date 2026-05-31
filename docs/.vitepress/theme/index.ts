import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import HomePage from './HomePage.vue'
import QuestionMeta from './QuestionMeta.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(QuestionMeta),
    })
  },
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  },
} satisfies Theme
