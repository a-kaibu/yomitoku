<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import EntryMeta from './components/EntryMeta.vue'
import EntryLicense from './components/EntryLicense.vue'
import NotFound from './components/NotFound.vue'

const { frontmatter } = useData()
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <EntryMeta v-if="frontmatter.function" />
    </template>
    <template #not-found>
      <NotFound />
    </template>
    <template #doc-after>
      <EntryLicense v-if="frontmatter.function" />
    </template>
  </DefaultTheme.Layout>
</template>
