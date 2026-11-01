<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { LANGUAGES } from '../../shared.mjs'

const { frontmatter } = useData()
const count = (id: string) => frontmatter.value.langCounts?.[id] ?? 0
</script>

<template>
  <section class="lang-grid" aria-label="言語を選ぶ">
    <a v-for="l in LANGUAGES" :key="l.id" class="lang-card" :style="{ '--c': l.color }" :href="withBase(`/${l.id}/`)" target="_self">
      <span class="lang-card__name">{{ l.name }}</span>
      <span class="lang-card__blurb">{{ l.blurb }}</span>
      <span class="lang-card__count">{{ count(l.id).toLocaleString() }} 記事</span>
    </a>
  </section>
</template>
