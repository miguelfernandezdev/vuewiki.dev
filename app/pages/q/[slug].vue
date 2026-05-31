<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

const { data: question } = await useAsyncData(
  `question-${route.params.slug}`,
  () => queryCollection('content').where('path', '=', `/questions/${route.params.slug}`).first()
)

if (!question.value) {
  throw createError({ statusCode: 404, message: 'Question not found' })
}

const difficultyColor = {
  beginner: 'success' as const,
  intermediate: 'warning' as const,
  advanced: 'error' as const,
}

useHead({
  title: `${question.value.title} — VueWiki.dev`,
})
</script>

<template>
  <div v-if="question">
    <div class="mb-6">
      <UButton
        to="/"
        icon="i-lucide-arrow-left"
        :label="t('detail.back')"
        color="neutral"
        variant="ghost"
        size="sm"
      />
    </div>

    <div class="mb-8">
      <UBadge
        :color="difficultyColor[question.difficulty as keyof typeof difficultyColor]"
        variant="subtle"
        class="mb-4"
      >
        {{ t(`filters.${question.difficulty}`) }}
      </UBadge>

      <h1 class="text-3xl sm:text-4xl font-bold text-(--ui-text)">
        {{ question.title }}
      </h1>
    </div>

    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="question" />
    </div>
  </div>
</template>
