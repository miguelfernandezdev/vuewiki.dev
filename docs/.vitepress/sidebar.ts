import fs from 'node:fs'
import path from 'node:path'
import type { DefaultTheme } from 'vitepress'

interface QuestionFrontmatter {
  title: string
  order: number
  tags: string[]
}

const TAG_ORDER: Record<string, number> = {
  core: 0,
  'composition-api': 1,
  reactivity: 2,
  directives: 3,
  components: 4,
  lifecycle: 5,
  'state-management': 6,
  'vue-router': 7,
  composables: 8,
  typescript: 9,
  testing: 10,
  performance: 11,
  architecture: 12,
  nuxt: 13,
  ssr: 14,
  errors: 15,
  'error-handling': 16,
  tooling: 17,
  forms: 18,
  animation: 19,
  styling: 20,
  migration: 21,
  'data-fetching': 22,
  debugging: 23,
  security: 24,
  accessibility: 25,
  pinia: 26,
  vite: 27,
  vitest: 28,
  vueuse: 29,
  vuex: 30,
  watchers: 31,
  'v-model': 32,
  'provide-inject': 33,
  slots: 34,
  suspense: 35,
  teleport: 36
}

const TAG_LABELS_EN: Record<string, string> = {
  core: 'Core',
  'composition-api': 'Composition API',
  reactivity: 'Reactivity',
  directives: 'Directives',
  components: 'Components',
  lifecycle: 'Lifecycle',
  'state-management': 'State Management',
  'vue-router': 'Vue Router',
  composables: 'Composables',
  typescript: 'TypeScript',
  testing: 'Testing',
  performance: 'Performance',
  architecture: 'Architecture',
  nuxt: 'Nuxt',
  ssr: 'SSR',
  errors: 'Common Errors',
  'error-handling': 'Error Handling',
  tooling: 'Tooling',
  forms: 'Forms',
  animation: 'Animation',
  styling: 'Styling',
  migration: 'Migration',
  'data-fetching': 'Data Fetching',
  debugging: 'Debugging',
  security: 'Security',
  accessibility: 'Accessibility',
  pinia: 'Pinia',
  vite: 'Vite',
  vitest: 'Vitest',
  vueuse: 'VueUse',
  vuex: 'Vuex',
  watchers: 'Watchers',
  'v-model': 'v-model',
  'provide-inject': 'Provide/Inject',
  slots: 'Slots',
  suspense: 'Suspense',
  teleport: 'Teleport'
}

const TAG_LABELS_ES: Record<string, string> = {
  core: 'Core',
  'composition-api': 'Composition API',
  reactivity: 'Reactividad',
  directives: 'Directivas',
  components: 'Componentes',
  lifecycle: 'Ciclo de vida',
  'state-management': 'Gestión de estado',
  'vue-router': 'Vue Router',
  composables: 'Composables',
  typescript: 'TypeScript',
  testing: 'Testing',
  performance: 'Rendimiento',
  architecture: 'Arquitectura',
  nuxt: 'Nuxt',
  ssr: 'SSR',
  errors: 'Errores comunes',
  'error-handling': 'Manejo de errores',
  tooling: 'Herramientas',
  forms: 'Formularios',
  animation: 'Animación',
  styling: 'Estilos',
  migration: 'Migración',
  'data-fetching': 'Data Fetching',
  debugging: 'Depuración',
  security: 'Seguridad',
  accessibility: 'Accesibilidad',
  pinia: 'Pinia',
  vite: 'Vite',
  vitest: 'Vitest',
  vueuse: 'VueUse',
  vuex: 'Vuex',
  watchers: 'Watchers',
  'v-model': 'v-model',
  'provide-inject': 'Provide/Inject',
  slots: 'Slots',
  suspense: 'Suspense',
  teleport: 'Teleport'
}

function parseFrontmatter(content: string): QuestionFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const fm = match[1]
  const title = fm.match(/title:\s*"(.+)"/)?.[1] ?? ''
  const order = Number(fm.match(/order:\s*(\d+)/)?.[1] ?? 0)
  const tagsMatch = fm.match(/tags:\s*\[(.+)\]/)
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map((t) => t.trim().replace(/["']/g, ''))
    : []

  return { title, order, tags }
}

function buildSidebarForLocale(
  docsDir: string,
  subdir: string,
  labels: Record<string, string>
): DefaultTheme.SidebarItem[] {
  const qDir = path.join(docsDir, subdir)
  if (!fs.existsSync(qDir)) return []

  const files = fs.readdirSync(qDir).filter((f) => f.endsWith('.md'))
  const groups = new Map<
    string,
    { title: string; order: number; slug: string }[]
  >()

  for (const file of files) {
    const content = fs.readFileSync(path.join(qDir, file), 'utf-8')
    const fm = parseFrontmatter(content)
    if (!fm) continue

    const primaryTag = fm.tags[0] ?? 'core'
    if (!groups.has(primaryTag)) groups.set(primaryTag, [])
    groups.get(primaryTag)!.push({
      title: fm.title,
      order: fm.order,
      slug: file.replace('.md', '')
    })
  }

  const urlPrefix = subdir.startsWith('es/') ? '/es' : ''

  return [...groups.entries()]
    .sort((a, b) => (TAG_ORDER[a[0]] ?? 99) - (TAG_ORDER[b[0]] ?? 99))
    .map(([tag, questions]) => ({
      text: `${labels[tag] ?? tag} (${questions.length})`,
      collapsed: true,
      items: questions
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          text: q.title,
          link: `${urlPrefix}/q/${q.slug}`
        }))
    }))
}

export function generateSidebar(docsDir: string): DefaultTheme.Sidebar {
  const en = buildSidebarForLocale(docsDir, 'q', TAG_LABELS_EN)
  const es = buildSidebarForLocale(docsDir, 'es/q', TAG_LABELS_ES)

  return {
    '/q/': en,
    '/es/q/': es
  }
}
