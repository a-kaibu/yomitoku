<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <div class="yk-404">
    <p class="yk-404__code">404</p>
    <h1>ページが見つかりません</h1>
    <p>探している関数は、まだ読まれていないのかもしれません。</p>
    <a class="yk-404__link" :href="withBase('/')" target="_self">ホームへ戻る</a>
  </div>
</template>

<style scoped>
.yk-404 { padding: 96px 24px; text-align: center; }
.yk-404__code { font-size: 64px; font-weight: 700; color: var(--vp-c-brand-1); line-height: 1; }
.yk-404 h1 { margin: 16px 0 8px; font-size: 22px; font-weight: 700; }
.yk-404 p { color: var(--vp-c-text-2); }
.yk-404__link { display: inline-block; margin-top: 24px; padding: 8px 20px; border-radius: 999px; background: var(--vp-c-brand-1); color: #fff; font-weight: 600; }
</style>
