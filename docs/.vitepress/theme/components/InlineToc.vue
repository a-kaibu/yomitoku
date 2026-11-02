<script setup lang="ts">
import { ref } from 'vue'
import { onContentUpdated } from 'vitepress'

// スマホ・タブレット用: 記事冒頭に置く開閉式の目次（PC では右側の目次を使う）
interface Item { id: string; text: string; level: number }
const items = ref<Item[]>([])

onContentUpdated(() => {
  items.value = [...document.querySelectorAll<HTMLElement>('.vp-doc h2[id], .vp-doc h3[id]')]
    .filter((h) => !h.closest('.entry-list'))
    .map((h) => ({
      id: h.id,
      text: (h.textContent ?? '').replace(/​/g, '').replace(/#\s*$/, '').trim(),
      level: h.tagName === 'H2' ? 2 : 3,
    }))
})
</script>

<template>
  <details v-if="items.length" class="yk-toc" open>
    <summary>目次</summary>
    <ol>
      <li v-for="i in items" :key="i.id" :class="`lv${i.level}`">
        <a :href="`#${encodeURIComponent(i.id)}`">{{ i.text }}</a>
      </li>
    </ol>
  </details>
</template>
