<script setup lang="ts">
interface Question {
  id: number
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

const questions: Question[] = [
  { id: 1, title: 'What is the Composition API and how does it differ from the Options API?', difficulty: 'beginner' },
  { id: 2, title: "What's the difference between ref and reactive?", difficulty: 'beginner' },
  { id: 3, title: 'What is <script setup>?', difficulty: 'beginner' },
  { id: 4, title: 'How do you declare props with TypeScript in Vue 3?', difficulty: 'beginner' },
  { id: 5, title: 'How do you emit events with TypeScript?', difficulty: 'beginner' },
  { id: 6, title: "What's the difference between v-if and v-show?", difficulty: 'beginner' },
  { id: 7, title: "What's the purpose of :key in v-for?", difficulty: 'beginner' },
  { id: 8, title: 'What is a composable?', difficulty: 'beginner' },
  { id: 9, title: 'What is Pinia and how does it differ from Vuex?', difficulty: 'beginner' },
  { id: 10, title: 'How does Vuex work?', difficulty: 'beginner' },
  { id: 11, title: "What's the difference between watch and watchEffect?", difficulty: 'intermediate' },
  { id: 12, title: 'How does v-model work on custom components?', difficulty: 'intermediate' },
  { id: 13, title: 'What are slots and what are they used for?', difficulty: 'intermediate' },
  { id: 14, title: 'What is Provide/Inject?', difficulty: 'intermediate' },
  { id: 15, title: 'How do you test Vue components with Vitest?', difficulty: 'intermediate' },
  { id: 16, title: 'How would you build a composable for data fetching?', difficulty: 'intermediate' },
  { id: 17, title: 'How would you implement debounce on a search input?', difficulty: 'intermediate' },
  { id: 18, title: 'How does Vue Router work and what are navigation guards?', difficulty: 'intermediate' },
  { id: 19, title: 'What are Teleport, Fragments, and Suspense?', difficulty: 'intermediate' },
  { id: 20, title: "How does Vue 3's reactivity system work?", difficulty: 'intermediate' },
  { id: 21, title: 'How would you plan a Vue 2 to Vue 3 migration?', difficulty: 'advanced' },
  { id: 22, title: 'When would you use shallowRef / shallowReactive?', difficulty: 'advanced' },
  { id: 23, title: 'How would you design a shared component library?', difficulty: 'advanced' },
  { id: 24, title: 'How would you optimize performance in a Vue app?', difficulty: 'advanced' },
  { id: 25, title: 'How would you test a composable that fetches data?', difficulty: 'advanced' },
  { id: 26, title: "What's the difference between computed and watch?", difficulty: 'advanced' },
  { id: 27, title: 'How would you handle complex forms in Vue?', difficulty: 'advanced' },
  { id: 28, title: 'How would you migrate a Vuex module to Pinia?', difficulty: 'advanced' },
  { id: 29, title: 'How would you structure a large Vue project?', difficulty: 'advanced' },
  { id: 30, title: 'How would you implement lazy loading and code splitting?', difficulty: 'advanced' },
]

const search = ref('')
const activeFilter = ref<string | null>(null)

const filteredQuestions = computed(() => {
  return questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.value.toLowerCase())
    const matchesFilter = !activeFilter.value || q.difficulty === activeFilter.value
    return matchesSearch && matchesFilter
  })
})

const difficultyColor = {
  beginner: 'success' as const,
  intermediate: 'warning' as const,
  advanced: 'error' as const,
}

const filters = [
  { label: 'All', value: null },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

useHead({
  title: 'VueWiki.dev — Vue.js interview questions with answers and examples',
  meta: [
    { name: 'description', content: 'Master Vue.js with real interview questions, clear answers, and code examples.' },
  ],
})
</script>

<template>
  <div>
    <section class="text-center mb-10">
      <h1 class="text-4xl sm:text-5xl font-bold text-(--ui-text) mb-4">
        Vue.js Interview Questions
      </h1>
      <p class="text-lg text-(--ui-text-muted) mb-8">
        {{ questions.length }} questions with answers and code examples
      </p>

      <div class="max-w-xl mx-auto">
        <UInput
          v-model="search"
          placeholder="Search questions..."
          icon="i-lucide-search"
          size="lg"
        />
      </div>
    </section>

    <section>
      <div class="flex gap-2 mb-6">
        <UButton
          v-for="filter in filters"
          :key="filter.label"
          :label="filter.label"
          :color="activeFilter === filter.value ? 'primary' : 'neutral'"
          :variant="activeFilter === filter.value ? 'solid' : 'outline'"
          size="sm"
          @click="activeFilter = filter.value"
        />
      </div>

      <div class="space-y-2">
        <UCard
          v-for="question in filteredQuestions"
          :key="question.id"
          :to="`/q/${question.id}`"
          as="NuxtLink"
          class="hover:ring-(--ui-primary) transition-shadow"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-(--ui-text)">
              {{ question.title }}
            </span>
            <UBadge
              :color="difficultyColor[question.difficulty]"
              variant="subtle"
              class="shrink-0"
            >
              {{ question.difficulty }}
            </UBadge>
          </div>
        </UCard>
      </div>

      <p v-if="filteredQuestions.length === 0" class="text-center text-(--ui-text-muted) py-8">
        No questions match your search.
      </p>
    </section>
  </div>
</template>
