<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { DIFFICULTIES } from '../../shared.mjs'

interface Item { u: string; t: string; d: string; f: string; p: string; n: string; lv: number; tg: string[] }
interface Project { slug: string; name: string; count: number }

const { frontmatter } = useData()
const items = computed<Item[]>(() => frontmatter.value.entries ?? [])
const projects = computed<Project[]>(() => frontmatter.value.projects ?? [])

const q = ref('')
const level = ref<number | ''>('')
const tag = ref('')

const allTags = computed(() => [...new Set(items.value.flatMap((i) => i.tg))].sort((a, b) => a.localeCompare(b, 'ja')))

const filtered = computed(() => {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean)
  return items.value.filter((i) => {
    if (level.value !== '' && i.lv !== level.value) return false
    if (tag.value && !i.tg.includes(tag.value)) return false
    if (!words.length) return true
    const hay = `${i.t} ${i.d} ${i.f} ${i.n} ${i.tg.join(' ')}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
})

const groups = computed(() =>
  projects.value
    .map((p) => ({ ...p, items: filtered.value.filter((i) => i.p === p.slug) }))
    .filter((g) => g.items.length),
)
const filtering = computed(() => q.value !== '' || level.value !== '' || tag.value !== '')
function reset() { q.value = ''; level.value = ''; tag.value = '' }
</script>

<template>
  <div class="entry-list">
    <div class="entry-list__filters" role="search">
      <input v-model="q" type="search" class="field field--grow" placeholder="キーワードで絞り込み" aria-label="キーワード" />
      <select v-model="level" class="field" aria-label="難易度">
        <option value="">難易度: すべて</option>
        <option v-for="(label, lv) in DIFFICULTIES" :key="lv" :value="Number(lv)">{{ label }}</option>
      </select>
      <select v-model="tag" class="field" aria-label="タグ">
        <option value="">タグ: すべて</option>
        <option v-for="t in allTags" :key="t" :value="t">#{{ t }}</option>
      </select>
    </div>
    <p class="entry-list__summary">
      {{ filtered.length.toLocaleString() }} / {{ items.length.toLocaleString() }} 関数
      <button v-if="filtering" class="link-button" @click="reset">条件をクリア</button>
    </p>

    <p v-if="!items.length" class="entry-list__empty">この言語の記事は準備中です。</p>
    <p v-else-if="!groups.length" class="entry-list__empty">条件に合う関数がありません。</p>

    <section v-for="g in groups" :key="g.slug" class="entry-group">
      <h2 :id="`p-${g.slug}`" tabindex="-1">
        {{ g.name }} <span class="entry-group__count">{{ g.items.length }}</span>
        <a class="header-anchor" :href="`#p-${g.slug}`" aria-hidden="true"></a>
      </h2>
      <ul class="entry-cards">
        <li v-for="i in g.items" :key="i.u">
          <a class="entry-card" :href="withBase(i.u)">
            <span class="entry-card__head">
              <code class="entry-card__fn">{{ i.f }}</code>
              <span class="badge badge--level" :data-level="i.lv">{{ DIFFICULTIES[i.lv] }}</span>
            </span>
            <span class="entry-card__title">{{ i.t }}</span>
            <span class="entry-card__desc">{{ i.d }}</span>
            <span class="entry-card__tags"><span v-for="t in i.tg" :key="t">#{{ t }}</span></span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>
