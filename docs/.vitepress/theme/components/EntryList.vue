<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { DIFFICULTIES } from '../../shared.mjs'

interface Item { u: string; t: string; d: string; f: string; p: string; n: string; lv: number; tg: string[] }
interface Project { slug: string; name: string; count: number }

const { frontmatter } = useData()
const projects = computed<Project[]>(() => frontmatter.value.projects ?? [])
// プロジェクトでグループ分けせず、関数名順の 1 つの一覧にする
const items = computed<Item[]>(() =>
  [...(frontmatter.value.entries ?? [])].sort((a: Item, b: Item) => String(a.f).localeCompare(String(b.f), 'ja', { sensitivity: 'base' })),
)

const q = ref('')
const level = ref<number | ''>('')
const tag = ref('')
const project = ref('')

const allTags = computed(() => [...new Set(items.value.flatMap((i) => i.tg))].sort((a, b) => a.localeCompare(b, 'ja')))

const filtered = computed(() => {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean)
  return items.value.filter((i) => {
    if (project.value && i.p !== project.value) return false
    if (level.value !== '' && i.lv !== level.value) return false
    if (tag.value && !i.tg.includes(tag.value)) return false
    if (!words.length) return true
    const hay = `${i.t} ${i.d} ${i.f} ${i.n} ${i.tg.join(' ')}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
})

const filtering = computed(() => q.value !== '' || level.value !== '' || tag.value !== '' || project.value !== '')
function reset() { q.value = ''; level.value = ''; tag.value = ''; project.value = '' }

// 絞り込み条件は URL（?project=…&tag=…）にも反映し、サイドバーや記事ページのリンクから開けるようにする
onMounted(() => {
  const sp = new URLSearchParams(location.search)
  project.value = sp.get('project') ?? ''
  tag.value = sp.get('tag') ?? ''
  q.value = sp.get('q') ?? ''
  const lv = Number(sp.get('level'))
  level.value = lv in DIFFICULTIES ? lv : ''
})
watch([q, level, tag, project], () => {
  const sp = new URLSearchParams()
  if (project.value) sp.set('project', project.value)
  if (tag.value) sp.set('tag', tag.value)
  if (level.value !== '') sp.set('level', String(level.value))
  if (q.value) sp.set('q', q.value)
  const qs = sp.toString()
  history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : ''))
})
</script>

<template>
  <div class="entry-list">
    <div class="entry-list__filters" role="search">
      <input v-model="q" type="search" class="field field--grow" placeholder="キーワードで絞り込み" aria-label="キーワード" />
    </div>
    <!-- 絞り込みはチップを押して選ぶ。もう一度押すと解除 -->
    <div class="filter-group" role="group" aria-labelledby="f-project">
      <span id="f-project" class="filter-group__label">プロジェクト</span>
      <button v-for="p in projects" :key="p.slug" type="button" class="chip chip--project" :class="{ 'is-active': project === p.slug }" :aria-pressed="project === p.slug" @click="project = project === p.slug ? '' : p.slug">{{ p.name }} <span class="chip__count">{{ p.count }}</span></button>
    </div>
    <div class="filter-group" role="group" aria-labelledby="f-level">
      <span id="f-level" class="filter-group__label">難易度</span>
      <button v-for="(label, lv) in DIFFICULTIES" :key="lv" type="button" class="chip chip--tag" :class="{ 'is-active': level === Number(lv) }" :aria-pressed="level === Number(lv)" @click="level = level === Number(lv) ? '' : Number(lv)">{{ label }}</button>
    </div>
    <div class="filter-group" role="group" aria-labelledby="f-tag">
      <span id="f-tag" class="filter-group__label">タグ</span>
      <button v-for="t in allTags" :key="t" type="button" class="chip chip--tag" :class="{ 'is-active': tag === t }" :aria-pressed="tag === t" @click="tag = tag === t ? '' : t">#{{ t }}</button>
    </div>
    <p class="entry-list__summary" aria-live="polite">
      {{ filtered.length.toLocaleString() }} / {{ items.length.toLocaleString() }} 記事
      <button v-if="filtering" class="link-button" @click="reset">条件をクリア</button>
    </p>

    <p v-if="!items.length" class="entry-list__empty">この言語の記事は準備中です。</p>
    <p v-else-if="!filtered.length" class="entry-list__empty">条件に合う記事がありません。</p>

    <ul class="entry-cards">
      <li v-for="i in filtered" :key="i.u" class="entry-card">
        <a class="entry-card__link" :href="withBase(i.u)" :aria-label="i.t"></a>
        <span class="entry-card__head">
          <code class="entry-card__fn">{{ i.f }}</code>
          <span class="badge badge--level" :data-level="i.lv">{{ DIFFICULTIES[i.lv] }}</span>
        </span>
        <span class="entry-card__title">{{ i.t }}</span>
        <span class="entry-card__desc">{{ i.d }}</span>
        <span class="entry-card__chips">
          <button type="button" class="chip chip--project" :class="{ 'is-active': project === i.p }" :aria-pressed="project === i.p" @click="project = project === i.p ? '' : i.p">{{ i.n }}</button>
          <button v-for="t in i.tg" :key="t" type="button" class="chip chip--tag" :class="{ 'is-active': tag === t }" :aria-pressed="tag === t" @click="tag = tag === t ? '' : t">#{{ t }}</button>
        </span>
      </li>
    </ul>
  </div>
</template>
