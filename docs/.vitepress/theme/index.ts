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
  },
} satisfies Theme
