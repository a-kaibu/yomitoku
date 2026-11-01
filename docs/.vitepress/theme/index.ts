import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import LanguageGrid from './components/LanguageGrid.vue'
import EntryList from './components/EntryList.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('LanguageGrid', LanguageGrid)
    app.component('EntryList', EntryList)
    if (typeof window !== 'undefined') {
      // コードブロックの「折り返し」ボタン（サイト全体で設定を共有し、次回も覚えておく）
      document.addEventListener('click', (e) => {
        const btn = (e.target as Element | null)?.closest?.('.yk-wrap-btn')
        if (!btn) return
        const on = document.documentElement.classList.toggle('yk-wrap')
        try { localStorage.setItem('yk-wrap', on ? '1' : '0') } catch {}
      })
    }
  },
} satisfies Theme
