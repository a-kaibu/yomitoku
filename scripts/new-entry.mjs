#!/usr/bin/env node
// 記事のひな形を作る。
//   npm run new -- <言語> <プロジェクト> <関数スラッグ>
//   例: npm run new -- go kubernetes wait-poll-until
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LANGUAGES, SLUG_RE } from '../docs/.vitepress/shared.mjs'

const [lang, project, slug] = process.argv.slice(2)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const L = LANGUAGES.find((l) => l.id === lang)
if (!L || !project || !slug) {
  console.error('使い方: npm run new -- <言語> <プロジェクト> <関数スラッグ>')
  console.error(`言語: ${LANGUAGES.map((l) => l.id).join(', ')}`)
  process.exit(1)
}
for (const s of [project, slug]) if (!SLUG_RE.test(s)) { console.error(`"${s}" は小文字英数字とハイフンのみにしてください`); process.exit(1) }
const file = path.join(root, 'docs', lang, project, `${slug}.md`)
if (fs.existsSync(file)) { console.error(`既にあります: ${path.relative(root, file)}`); process.exit(1) }
const tpl = fs.readFileSync(path.join(root, 'scripts', 'entry-template.md'), 'utf8')
  .replaceAll('{{language}}', lang)
  .replaceAll('{{fence}}', L.fences[0])
fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, tpl)
console.log(`作成しました: ${path.relative(root, file)}`)
