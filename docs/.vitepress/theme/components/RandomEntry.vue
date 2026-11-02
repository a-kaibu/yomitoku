<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { LANGUAGES } from '../../shared.mjs'

// 全記事の URL リストから 1 本選び、その記事のページからタイトルなどを読む。
// 読み込むまでは同じ大きさの枠を見えない状態で置き、下の要素が動かないようにする。
const blank = ' '
const pick = ref({ u: '', f: blank, t: blank, d: blank, l: '' })
const ready = ref(false)

onMounted(async () => {
  try {
    const urls: string[] = await (await fetch(withBase('/random.json'))).json()
    const u = urls[Math.floor(Math.random() * urls.length)]
    const res = await fetch(withBase(`${u}.html`))
    if (!res.ok) return
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
    pick.value = {
      u,
      l: u.split('/')[1],
      f: doc.querySelector('.entry-meta__table dd code')?.textContent ?? blank,
      t: doc.querySelector('.entry-title')?.textContent ?? blank,
      d: doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? blank,
    }
    ready.value = true
  } catch {}
})
const lang = (id: string) => LANGUAGES.find((l) => l.id === id)
</script>

<template>
  <ul class="entry-cards random-entry" :class="{ 'is-ready': ready }">
    <li class="entry-card">
      <!-- 言語ごとに別ビルドなので、通常のページ読み込みで開く -->
      <a v-if="ready" class="entry-card__link" :href="withBase(pick.u)" target="_self" :aria-label="pick.t"></a>
      <span class="entry-card__head">
        <code class="entry-card__fn">{{ pick.f }}</code>
        <span class="badge badge--lang" :style="{ '--c': lang(pick.l)?.color, '--fg': lang(pick.l)?.fg }">{{ lang(pick.l)?.name ?? blank }}</span>
      </span>
      <span class="entry-card__title">{{ pick.t }}</span>
      <span class="entry-card__desc">{{ pick.d }}</span>
    </li>
  </ul>
</template>
