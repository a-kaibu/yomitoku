import DefaultTheme from 'vitepress/theme'
import { onContentUpdated, type Theme } from 'vitepress'
import Layout from './Layout.vue'
import LanguageGrid from './components/LanguageGrid.vue'
import EntryList from './components/EntryList.vue'
import RandomEntry from './components/RandomEntry.vue'
import './style.css'

// 折り返しボタンの押下状態（aria-pressed）を、いまの設定に合わせる
function syncWrapButtons() {
  const on = String(document.documentElement.classList.contains('yk-wrap'))
  document.querySelectorAll('.yk-wrap-btn').forEach((b) => b.setAttribute('aria-pressed', on))
}

export default {
  setup() { onContentUpdated(syncWrapButtons) },
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('LanguageGrid', LanguageGrid)
    app.component('EntryList', EntryList)
    app.component('RandomEntry', RandomEntry)
    if (typeof window !== 'undefined') {
      // コードブロックの「折り返し」ボタン（サイト全体で設定を共有し、次回も覚えておく）
      document.addEventListener('click', (e) => {
        const btn = (e.target as Element | null)?.closest?.('.yk-wrap-btn')
        if (!btn) return
        const on = document.documentElement.classList.toggle('yk-wrap')
        syncWrapButtons()
        try { localStorage.setItem('yk-wrap', on ? '1' : '0') } catch {}
      })
    }
  },
} satisfies Theme
