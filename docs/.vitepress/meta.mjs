// ヨミトク: サイト全体で共有するメタデータと記事ローダー。
// config.mts（ビルド）と scripts/validate.mjs（検証）の両方から読み込まれます。
// 言語スレッドはこのファイルを編集しないでください（タグ追加などは土台側で行います）。

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { LANGUAGE_IDS } from './shared.mjs'

export * from './shared.mjs'

/**
 * docs/<lang>/<project>/<slug>.md をすべて（langs を指定したらその言語だけ）読み込む。
 * 戻り値: { lang, projectSlug, slug, relativePath, url, fm, content }[]
 */
export function loadEntries(docsDir, langs = LANGUAGE_IDS) {
  const entries = []
  for (const lang of langs) {
    const langDir = path.join(docsDir, lang)
    if (!fs.existsSync(langDir)) continue
    for (const projectSlug of fs.readdirSync(langDir).sort()) {
      const projectDir = path.join(langDir, projectSlug)
      if (!fs.statSync(projectDir).isDirectory()) continue
      for (const file of fs.readdirSync(projectDir).sort()) {
        if (!file.endsWith('.md') || file === 'index.md') continue
        const slug = file.slice(0, -3)
        const relativePath = `${lang}/${projectSlug}/${file}`
        const raw = fs.readFileSync(path.join(projectDir, file), 'utf8')
        const { data, content } = matter(raw)
        entries.push({ lang, projectSlug, slug, relativePath, url: `/${lang}/${slug}`, fm: data, content })
      }
    }
  }
  return entries
}
