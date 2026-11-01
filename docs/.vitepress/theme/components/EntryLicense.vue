<script setup lang="ts">
import { useData } from 'vitepress'
const { frontmatter: fm } = useData()
</script>

<template>
  <aside class="entry-license">
    <p>
      引用元: <a :href="fm.sourceUrl" target="_blank" rel="noopener">{{ fm.project }} / {{ fm.file }}</a>
      （コミット <code>{{ String(fm.commit).slice(0, 7) }}</code> 時点）
    </p>
    <p>
      <template v-if="fm.copyright">{{ fm.copyright }}. </template>
      このコードは <strong>{{ fm.license }}</strong> ライセンスのもとで公開されており、学習・解説を目的として引用しています。
      解説文は CC BY 4.0 です。
    </p>
  </aside>
</template>
