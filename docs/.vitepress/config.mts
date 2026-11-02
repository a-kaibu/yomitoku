import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { transformerStyleToClass } from '@shikijs/transformers'
import { LANGUAGES, DIFFICULTIES, loadEntries, sourceUrl } from './meta.mjs'
import { dedent } from './code.mjs'

const docsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ---- 分割ビルド -----------------------------------------------------------
// 1 万ページ超を 1 回の VitePress ビルドで処理するとメモリが足りないため、
// 本番ビルドは「ハブ（トップ）」と「言語ごと」に分けて行い、出力を 1 つにまとめる。
//   YK_SITE=hub  → index.md だけ
//   YK_SITE=go   → docs/go/** だけ
//   未指定       → 全部（npm run dev 用。dev サーバーは必要なページだけ変換するので重くない）
// 別ビルドのページへのリンクは SPA ルーターでは開けないので、必ず target: '_self'（通常のページ遷移）にする。
const SITE = process.env.YK_SITE || ''
const LANG_IDS = LANGUAGES.map((l) => l.id)
if (SITE && SITE !== 'hub' && !LANG_IDS.includes(SITE)) throw new Error(`YK_SITE="${SITE}" は hub か ${LANG_IDS.join(', ')} のどれか`)
const srcExclude =
  SITE === 'hub' ? LANG_IDS.map((id) => `${id}/**`)
  : SITE ? ['index.md', 'about.md', ...LANG_IDS.filter((id) => id !== SITE).map((id) => `${id}/**`)]
  : []
const entries = loadEntries(docsDir, SITE && SITE !== 'hub' ? [SITE] : LANG_IDS)
const self = '_self'

// 本番ビルドでは、シンタックスハイライトの色をインライン style ではなくクラスにして HTML を軽くする
// （1 万ページ超で数百 MB の差になる）。CSS はビルド後に shiki-<site>.css として書き出す。
const isBuild = process.argv.includes('build')
const styleToClass = isBuild ? transformerStyleToClass({ classPrefix: 'sk-' }) : null
const shikiCss = `shiki-${SITE || 'all'}.css`

// ---- 集計 ---------------------------------------------------------------
type Entry = (typeof entries)[number]
const byPath = new Map(entries.map((e) => [e.relativePath, e]))
const byLang = new Map<string, Entry[]>()
for (const e of entries) {
  if (!byLang.has(e.lang)) byLang.set(e.lang, [])
  byLang.get(e.lang)!.push(e)
}
const sortKey = (e: Entry) => `${e.projectSlug}\u0000${String(e.fm.function ?? e.slug).toLowerCase()}`
for (const list of byLang.values()) list.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
const byProject = new Map<string, Entry[]>()
for (const list of byLang.values())
  for (const e of list) {
    const k = `${e.lang}/${e.projectSlug}`
    if (!byProject.has(k)) byProject.set(k, [])
    byProject.get(k)!.push(e)
  }

function projectsOf(lang: string) {
  const map = new Map<string, { slug: string; name: string; count: number }>()
  for (const e of byLang.get(lang) ?? []) {
    const p = map.get(e.projectSlug) ?? { slug: e.projectSlug, name: String(e.fm.project ?? e.projectSlug), count: 0 }
    p.count++
    map.set(e.projectSlug, p)
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// ---- サイドバー -----------------------------------------------------------
// ・言語トップ（/go/）では、その言語のプロジェクト一覧
// ・記事ページ（/go/<project>/...）では、そのプロジェクトの関数一覧
// VitePress は最も深く一致するキーのサイドバーを使う。サイドバーは各ページの HTML に描画されるので、
// 全記事を 1 つのサイドバーに並べるとページが重くなる。プロジェクト単位に分けているのはそのため。
const sidebar: DefaultTheme.SidebarMulti = {}
for (const l of LANGUAGES) {
  const projects = projectsOf(l.id)
  const others = {
    text: 'ほかの言語',
    collapsed: true,
    items: LANGUAGES.filter((o) => o.id !== l.id).map((o) => ({ text: o.name, link: `/${o.id}/`, target: self })),
  }
  sidebar[`/${l.id}/`] = [
    { text: `${l.name} の記事一覧`, link: `/${l.id}/`, target: self },
    {
      text: 'プロジェクト',
      collapsed: false,
      items: projects.map((p) => ({ text: `${p.name}（${p.count}）`, link: `/${l.id}/#p-${p.slug}`, target: self })),
    },
    others,
  ]
  for (const p of projects) {
    sidebar[`/${l.id}/${p.slug}/`] = [
      { text: `← ${l.name} の記事一覧`, link: `/${l.id}/`, target: self },
      {
        text: `${p.name} の関数`,
        collapsed: false,
        items: (byProject.get(`${l.id}/${p.slug}`) ?? []).map((e) => ({ text: String(e.fm.function ?? e.slug), link: e.url })),
      },
      others,
    ]
  }
}

export default defineConfig({
  lang: 'ja-JP',
  title: 'ヨクヨム',
  description: '有名 OSS の名作コードをひとつずつ、日本語でていねいに読み解くコードリーディングサイト',
  base: process.env.BASE ?? '/yokuyomu/',
  cleanUrls: true,
  lastUpdated: false,
  srcExclude,
  outDir: SITE ? `.vitepress/dist-${SITE}` : '.vitepress/dist',
  // 1 万ページ超でも各 HTML が太らないよう、サイトメタデータを別チャンクに分離する
  metaChunk: true,
  head: [
    ...(styleToClass ? [['link', { rel: 'stylesheet', href: `${process.env.BASE ?? '/yokuyomu/'}${shikiCss}` }] as [string, Record<string, string>]] : []),
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    // コードの折り返し設定をちらつきなく復元する
    ['script', {}, "try{localStorage.getItem('yk-wrap')==='1'&&document.documentElement.classList.add('yk-wrap')}catch(e){}"],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'ja_JP' }],
  ],
  markdown: {
    lineNumbers: false,
    theme: { light: 'github-light', dark: 'github-dark' },
    codeTransformers: styleToClass ? [styleToClass] : [],
    codeCopyButtonTitle: 'コードをコピー',
    config(md) {
      // 記事ページでは、本文中の生 HTML（例: 地の文に書いた List<T>）をただの文字として扱い、
      // {{ }} も Vue に解釈させない（v-pre）。1 本の記事の書き方ミスで言語全体のビルドが落ちないようにする。
      const isEntry = (env: any) => /^[a-z]+\/[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(env?.relativePath ?? '')
      md.core.ruler.push('yk-escape-html', (state) => {
        if (!isEntry(state.env)) return
        const walk = (tokens: any[]) => {
          for (const t of tokens) {
            if ((t.type === 'html_inline' || t.type === 'html_block') && !/^\s*<!--[\s\S]*-->\s*$/.test(t.content)) {
              t.type = 'text'
            }
            if (t.children) walk(t.children)
          }
        }
        walk(state.tokens)
      })
      const render = md.render.bind(md)
      md.render = (src: string, env?: any) => {
        const html = render(src, env)
        return isEntry(env) ? `<div v-pre>${html}</div>` : html
      }
      // すべてのコードブロックを自動でデデントし、折り返し切り替えボタンを付ける。
      // ハイライト自体は VitePress 標準の Shiki のまま（ここではテキストとラッパーだけ触る）。
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        token.content = dedent(token.content.replace(/\n$/, '').split('\n')).join('\n') + '\n'
        let html = fence(tokens, idx, options, env, self)
        html = html.replace(
          '<button title="コードをコピー" class="copy"></button>',
          '$&<button type="button" class="yk-wrap-btn" title="折り返しを切り替え" aria-label="コードの折り返しを切り替え"></button>',
        )
        const start = token.info.match(/:line-numbers=(\d+)/)
        if (start) html = html.replace(/^<div class="language-/, `<div style="--yk-start:${Number(start[1]) - 1}" class="language-`)
        return html
      }
    },
  },
  buildEnd(siteConfig) {
    if (styleToClass) fs.writeFileSync(path.join(siteConfig.outDir, shikiCss), styleToClass.getCSS())
  },
  transformPageData(pageData) {
    const rel = pageData.relativePath
    // トップページ: 言語ごとの記事数
    if (rel === 'index.md') {
      pageData.frontmatter.langCounts = Object.fromEntries(LANGUAGES.map((l) => [l.id, byLang.get(l.id)?.length ?? 0]))
      return
    }
    // 言語トップ: 記事一覧データを埋め込む（その言語のページにだけ載る）
    const m = rel.match(/^([a-z]+)\/index\.md$/)
    if (m && LANGUAGES.some((l) => l.id === m[1])) {
      const list = byLang.get(m[1]) ?? []
      pageData.frontmatter.projects = projectsOf(m[1])
      pageData.frontmatter.entries = list.map((e) => ({
        u: e.url,
        t: e.fm.title,
        d: e.fm.description,
        f: e.fm.function,
        p: e.projectSlug,
        n: e.fm.project,
        lv: e.fm.difficulty,
        tg: e.fm.tags ?? [],
      }))
      return
    }
    // 記事ページ: 固定リンクと、同じプロジェクト内での前後リンク
    const entry = byPath.get(rel)
    if (!entry) return
    pageData.frontmatter.sourceUrl = sourceUrl(entry.fm)
    pageData.frontmatter.difficultyLabel = DIFFICULTIES[entry.fm.difficulty as 1 | 2 | 3]
    const siblings = byProject.get(`${entry.lang}/${entry.projectSlug}`)!
    const i = siblings.indexOf(entry)
    const link = (e?: Entry) => (e ? { text: String(e.fm.function ?? e.slug), link: e.url } : false)
    pageData.frontmatter.prev ??= link(siblings[i - 1])
    pageData.frontmatter.next ??= link(siblings[i + 1])
  },
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/', target: self },
      {
        text: '言語',
        items: LANGUAGES.map((l) => ({ text: l.name, link: `/${l.id}/`, target: self, activeMatch: `^/${l.id}/` })),
      },
    ],
    logoLink: { link: process.env.BASE ?? '/yokuyomu/', target: self },
    sidebar,
    outline: { label: 'このページの内容', level: [2, 3] },
    docFooter: { prev: '前の関数', next: '次の関数' },
    darkModeSwitchLabel: '外観',
    lightModeSwitchTitle: 'ライトモードに切り替え',
    darkModeSwitchTitle: 'ダークモードに切り替え',
    sidebarMenuLabel: 'メニュー',
    returnToTopLabel: 'トップに戻る',
    langMenuLabel: '言語を変更',
    notFound: {
      title: 'ページが見つかりません',
      quote: '探している関数は、まだ読まれていないのかもしれません。',
      linkLabel: 'ホームへ戻る',
      linkText: 'ホームへ戻る',
    },
    footer: {
      message: '解説文は CC BY 4.0、引用コードは各プロジェクトのライセンスに従います。',
      copyright: 'ヨクヨム',
    },
    // 検索は言語ごとのビルドに閉じる（＝その言語の中を検索する）。ハブには付けない。
    search: SITE === 'hub' ? undefined : {
      provider: 'local',
      options: {
        // 1 万記事分の全文インデックスは重すぎるので、タイトル・要約・関数名・タグだけを索引する
        _render(src, env, md) {
          const html = md.render(src, env)
          const fm = env.frontmatter ?? {}
          if (fm.search === false) return ''
          if (!fm.function) return html
          const words = [fm.project, fm.function, ...(fm.tags ?? [])].filter(Boolean).join(' / ')
          return md.render(`# ${fm.title}\n\n${fm.description ?? ''}\n\n${words}`)
        },
        miniSearch: { searchOptions: { prefix: true, fuzzy: 0.2 } },
        translations: {
          button: { buttonText: '検索', buttonAriaLabel: '検索' },
          modal: {
            displayDetails: '詳細を表示',
            resetButtonTitle: 'リセット',
            backButtonTitle: '閉じる',
            noResultsText: '見つかりませんでした',
            footer: { selectText: '選択', navigateText: '移動', closeText: '閉じる' },
          },
        },
      },
    },
  },
})
