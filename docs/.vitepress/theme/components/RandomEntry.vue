<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { LANGUAGES } from '../../shared.mjs'

interface Pick { u: string; l: string; f: string; t: string; d: string }
const { frontmatter } = useData()
const pick = ref<Pick | null>(null)
// 開くたびにブラウザ側で 1 本選ぶ
onMounted(() => {
  const list: Pick[] = frontmatter.value.picks ?? []
  pick.value = list[Math.floor(Math.random() * list.length)] ?? null
})
const lang = (id: string) => LANGUAGES.find((l) => l.id === id)
</script>

<template>
  <ul v-if="pick" class="entry-cards random-entry">
    <li class="entry-card">
      <a class="entry-card__link" :href="withBase(pick.u)" :aria-label="pick.t"></a>
      <span class="entry-card__head">
        <code class="entry-card__fn">{{ pick.f }}</code>
        <span class="badge badge--lang" :style="{ '--c': lang(pick.l)?.color, '--fg': lang(pick.l)?.fg }">{{ lang(pick.l)?.name }}</span>
      </span>
      <span class="entry-card__title">{{ pick.t }}</span>
      <span class="entry-card__desc">{{ pick.d }}</span>
    </li>
  </ul>
</template>
