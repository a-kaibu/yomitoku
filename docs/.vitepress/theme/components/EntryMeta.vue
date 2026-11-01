<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { LANGUAGES } from '../../shared.mjs'

const { frontmatter: fm } = useData()
const lang = computed(() => LANGUAGES.find((l) => l.id === fm.value.language))
const shortSha = computed(() => String(fm.value.commit ?? '').slice(0, 7))
const lines = computed(() => {
  const [s, e] = fm.value.lines ?? []
  return e && e !== s ? `${s}〜${e} 行目` : `${s} 行目`
})
</script>

<template>
  <h1 class="entry-title">{{ fm.title }}</h1>
  <div class="entry-meta">
    <div class="entry-meta__badges">
      <a v-if="lang" class="badge badge--lang" :style="{ '--c': lang.color }" :href="withBase(`/${lang.id}/`)">{{ lang.name }}</a>
      <span class="badge badge--level" :data-level="fm.difficulty">{{ fm.difficultyLabel }}</span>
      <span v-for="t in fm.tags ?? []" :key="t" class="badge badge--tag">#{{ t }}</span>
    </div>
    <dl class="entry-meta__table">
      <div><dt>プロジェクト</dt><dd><a :href="fm.repo" target="_blank" rel="noopener">{{ fm.project }}</a></dd></div>
      <div><dt>関数</dt><dd><code>{{ fm.function }}</code></dd></div>
      <div>
        <dt>場所</dt>
        <dd class="entry-meta__path">
          <a :href="fm.sourceUrl" target="_blank" rel="noopener"><code>{{ fm.file }}</code></a>
          <span class="muted">（{{ lines }} / コミット <code>{{ shortSha }}</code>）</span>
        </dd>
      </div>
      <div><dt>ライセンス</dt><dd>{{ fm.license }}</dd></div>
    </dl>
  </div>
</template>
