<script setup lang="ts">
const { t } = useI18n()

const { data: questions } = await useAsyncData(
  'questions',
  () => queryCollection('content').where('path', 'LIKE', '/questions/%').order('order', 'ASC').all()
)

const search = ref('')
const activeFilter = ref<string | null>(null)

const filteredQuestions = computed(() => {
  if (!questions.value) return []
  return questions.value.filter((q) => {
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
  { label: t('filters.all'), value: null },
  { label: t('filters.beginner'), value: 'beginner' },
  { label: t('filters.intermediate'), value: 'intermediate' },
  { label: t('filters.advanced'), value: 'advanced' },
]

const totalQuestions = computed(() => questions.value?.length ?? 0)

useSeoMeta({
  title: t('seo.title'),
  ogTitle: t('seo.title'),
  description: t('seo.description'),
  ogDescription: t('seo.description'),
  ogType: 'website',
})
</script>

<template>
  <div>
    <section class="text-center mb-10">
      <h1 class="text-4xl sm:text-5xl font-bold text-(--ui-text) mb-4">
        {{ t('home.title') }}
      </h1>
      <p class="text-lg text-(--ui-text-muted) mb-8">
        {{ t('home.subtitle', { count: totalQuestions }) }}
      </p>

      <div class="max-w-xl mx-auto">
        <UInput
          v-model="search"
          :placeholder="t('home.searchPlaceholder')"
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
        <NuxtLink
          v-for="question in filteredQuestions"
          :key="question.path"
          :to="`/q/${question.path.split('/').pop()}`"
          class="block"
        >
          <UCard class="hover:ring-(--ui-primary) transition-shadow cursor-pointer">
            <div class="flex items-center justify-between gap-3">
              <span class="text-(--ui-text)">
                {{ question.title }}
              </span>
              <UBadge
                :color="difficultyColor[question.difficulty as keyof typeof difficultyColor]"
                variant="subtle"
                class="shrink-0"
              >
                {{ t(`filters.${question.difficulty}`) }}
              </UBadge>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <p v-if="filteredQuestions.length === 0" class="text-center text-(--ui-text-muted) py-8">
        {{ t('home.noResults') }}
      </p>
    </section>
  </div>
</template>
