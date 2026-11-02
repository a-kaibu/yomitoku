#!/usr/bin/env node
// 記事フォーマットの検証。CONTRIBUTING.md のルールを機械的にチェックします。
//
//   npm run validate                         # 全記事
//   npm run validate -- docs/go              # 一部だけ（ディレクトリ or ファイル）
//   npm run validate -- --verify-source docs/go/kubernetes
//                                            # 引用コードが GitHub の該当コミット・該当行と一致するかも確認（ネットワーク使用）
//
// エラーが 1 件でもあれば終了コード 1。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LANGUAGES, LANGUAGE_IDS, TAGS, checkLicense, DIFFICULTIES, SLUG_RE, SHA_RE,
  REQUIRED_HEADINGS, MAX_EXCERPT_LINES, loadEntries,
} from '../docs/.vitepress/meta.mjs'
import { compareExcerpt, hasEnglishComment } from '../docs/.vitepress/code.mjs'

const MAX_EXTRA_LINES = 60

/** 本文のコードブロックを取り出す。excerpt は :line-numbers 付き（＝元ファイルからの引用）のもの */
function parseBlocks(lines) {
  const blocks = []
  let section = null
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^##\s+(.+?)\s*$/)
    if (h) { section = h[1]; continue }
    const open = lines[i].match(/^(\s*)(```+|~~~+)(.*)$/)
    if (!open) continue
    const fence = open[2]
    const info = open[3].trim()
    let j = i + 1
    while (j < lines.length && !lines[j].trim().startsWith(fence)) j++
    const code = lines.slice(i + 1, j)
    const m = info.match(/^([\w+#-]+):line-numbers=(\d+)(?:\s*\{[^}]*\})?(?:\s*\[([^\]]+)\])?\s*$/)
    const prev = lines.slice(Math.max(0, i - 3), i).reverse().find((l) => l.trim())
    const src = prev?.match(/^<!--\s*source:\s*(\S+)\s*-->$/)
    blocks.push({
      line: i + 1, info, code, section, closed: j < lines.length,
      excerpt: m ? { lang: m[1], start: Number(m[2]), title: m[3], source: src?.[1] } : null,
    })
    i = j
  }
  return blocks
}

/** 指定した ## セクション内の ### 見出しと範囲（1 始まりの行番号） */
function sectionH3(lines, h2) {
  const s = lines.findIndex((l) => new RegExp(`^##\\s+${h2}\\s*$`).test(l))
  if (s < 0) return []
  let e = lines.findIndex((l, i) => i > s && /^##\s/.test(l))
  if (e < 0) e = lines.length
  const out = []
  let inFence = false
  for (let i = s + 1; i < e; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) inFence = !inFence
    const m = !inFence && lines[i].match(/^###\s+(.+?)\s*$/)
    if (m) { if (out.length) out[out.length - 1].to = i + 1; out.push({ title: m[1], from: i + 1, to: e + 1 }) }
  }
  return out
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsDir = path.join(root, 'docs')

const args = process.argv.slice(2)
const verifySource = args.includes('--verify-source')
const filters = args.filter((a) => !a.startsWith('--')).map((a) => path.resolve(a))

const errors = []
const warnings = []
const err = (file, msg) => errors.push(`${file}: ${msg}`)
const warn = (file, msg) => warnings.push(`${file}: ${msg}`)

const inScope = (rel) => !filters.length || filters.some((f) => path.join(docsDir, rel).startsWith(f))

// ---- 1. ディレクトリ構造 -------------------------------------------------
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}
for (const lang of LANGUAGE_IDS) {
  const langDir = path.join(docsDir, lang)
  if (!fs.existsSync(path.join(langDir, 'index.md'))) err(`docs/${lang}`, 'index.md がありません（土台側のファイルです）')
  if (!fs.existsSync(langDir)) continue
  for (const abs of walk(langDir)) {
    const rel = path.relative(docsDir, abs).split(path.sep).join('/')
    if (!inScope(rel)) continue
    const parts = rel.split('/')
    if (rel === `${lang}/index.md`) continue
    if (parts.length !== 3) { err(`docs/${rel}`, '記事は docs/<言語>/<プロジェクト>/<関数スラッグ>.md の深さに置いてください'); continue }
    const [, project, file] = parts
    if (!SLUG_RE.test(project)) err(`docs/${rel}`, `プロジェクトのディレクトリ名 "${project}" は小文字英数字とハイフンのみ`)
    if (!file.endsWith('.md')) { err(`docs/${rel}`, '.md 以外のファイルは置けません'); continue }
    if (file === 'index.md') err(`docs/${rel}`, 'プロジェクト直下に index.md は置けません（一覧は自動生成されます）')
    else if (!SLUG_RE.test(file.slice(0, -3))) err(`docs/${rel}`, `ファイル名 "${file}" は小文字英数字とハイフンのみ（例: heapq-siftup.md）`)
  }
}

// ---- 2. 各記事 ----------------------------------------------------------
const entries = loadEntries(docsDir)
const projectInfo = new Map() // `${lang}/${project}` -> { project, repo, file }
const seenSlug = new Map()    // lang/slug -> file
const seenSource = new Map()  // repo+file+function -> file
const toVerify = []

for (const e of entries) {
  const f = `docs/${e.relativePath}`
  const fm = e.fm
  const scoped = inScope(e.relativePath)

  // プロジェクト単位の一貫性（スコープ外の記事も基準として使う）
  const key = `${e.lang}/${e.projectSlug}`
  const info = projectInfo.get(key)
  if (!info) projectInfo.set(key, { project: fm.project, repo: fm.repo, file: f })
  else if (scoped) {
    if (info.project !== fm.project) err(f, `project が同じディレクトリの ${info.file} と違います（"${info.project}" に統一）`)
    if (info.repo !== fm.repo) err(f, `repo が同じディレクトリの ${info.file} と違います（${info.repo} に統一）`)
  }
  // URL は /<言語>/<slug> なので、slug は言語内（プロジェクトをまたいで）一意
  const urlKey = `${e.lang}/${e.slug}`
  if (seenSlug.has(urlKey) && scoped) err(f, `ファイル名（slug）"${e.slug}" が同じ言語の ${seenSlug.get(urlKey)} と重複しています。URL は /${e.lang}/<slug> になるので、言語内で一意にしてください（例: ${e.projectSlug}-${e.slug}.md）`)
  if (!seenSlug.has(urlKey)) seenSlug.set(urlKey, f)
  const srcKey = `${fm.repo}|${fm.file}|${fm.function}`
  if (seenSource.has(srcKey) && scoped) err(f, `同じ関数の記事が既にあります: ${seenSource.get(srcKey)}`)
  seenSource.set(srcKey, f)

  if (!scoped) continue

  const str = (k, max) => {
    if (typeof fm[k] !== 'string' || !fm[k].trim()) { err(f, `${k} は必須の文字列です`); return false }
    if (max && [...fm[k]].length > max) err(f, `${k} は ${max} 文字以内にしてください（現在 ${[...fm[k]].length} 文字）`)
    return true
  }
  str('title', 60)
  str('description', 140)
  str('project', 40)
  str('function', 120)
  str('file')
  str('copyright', 200)
  if (fm.language !== e.lang) err(f, `language は "${e.lang}"（ディレクトリ名）にしてください`)
  if (typeof fm.repo !== 'string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(fm.repo)) err(f, 'repo は https://github.com/<owner>/<repo> 形式（末尾スラッシュ・.git なし）')
  if (typeof fm.commit !== 'string') err(f, 'commit は 40 桁の SHA を "クォートした文字列" で書いてください')
  else if (!SHA_RE.test(fm.commit) || /^0+$/.test(fm.commit)) err(f, 'commit は 40 桁の小文字 16 進 SHA（ブランチ名やタグは不可）')
  if (typeof fm.file === 'string' && (fm.file.startsWith('/') || fm.file.includes('..'))) err(f, 'file はリポジトリルートからの相対パス')
  const licenseProblem = checkLicense(fm.license)
  if (licenseProblem) err(f, `license: ${licenseProblem}（docs/.vitepress/shared.mjs の LICENSES / LICENSE_EXCEPTIONS）`)
  if (!(fm.difficulty in DIFFICULTIES)) err(f, 'difficulty は 1（入門）/ 2（中級）/ 3（上級）')
  if (!Array.isArray(fm.tags) || fm.tags.length < 1 || fm.tags.length > 5) err(f, 'tags は 1〜5 個の配列')
  else for (const t of fm.tags) if (!TAGS.includes(t)) err(f, `タグ "${t}" は語彙にありません（docs/.vitepress/shared.mjs の TAGS）`)

  let start, end
  if (!Array.isArray(fm.lines) || fm.lines.length !== 2 || !fm.lines.every(Number.isInteger)) err(f, 'lines は [開始行, 終了行] の整数 2 つ')
  else {
    ;[start, end] = fm.lines
    if (start < 1 || end < start) err(f, 'lines の範囲が不正です')
    else if (end - start + 1 > MAX_EXCERPT_LINES) err(f, `引用は ${MAX_EXCERPT_LINES} 行以内にしてください（現在 ${end - start + 1} 行）`)
  }

  // ---- 本文 ----
  const body = e.content
  const lines = body.split('\n')
  let inFence = false
  const h2 = []
  for (const l of lines) {
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence
    if (inFence) continue
    if (/^#\s/.test(l)) err(f, '本文に H1（# 見出し）は書かないでください（タイトルは frontmatter から自動表示）')
    const m = l.match(/^##\s+(.+?)\s*$/)
    if (m) h2.push(m[1])
  }
  if (JSON.stringify(h2) !== JSON.stringify(REQUIRED_HEADINGS)) {
    err(f, `## 見出しは次の 6 つをこの順番で: ${REQUIRED_HEADINGS.join(' / ')}（現在: ${h2.join(' / ') || 'なし'}）`)
  }

  // ---- コードブロック ----
  // v2（format: 2）の新ルールは必須。旧形式の記事では警告にとどめる。
  const v2 = fm.format === 2
  const rule = (msg) => (v2 ? err(f, msg) : warn(f, `[旧形式→format: 2 で必須] ${msg}`))
  if (fm.format !== undefined && fm.format !== 2) err(f, 'format は 2 にしてください')

  const fences = LANGUAGES.find((l) => l.id === e.lang)?.fences ?? []
  const blocks = parseBlocks(lines)
  const excerpts = blocks.filter((b) => b.excerpt)
  for (const b of excerpts) {
    if (!fences.includes(b.excerpt.lang)) err(f, `コードブロックの言語 "${b.excerpt.lang}" は ${fences.join(', ')} のどれかにしてください（${b.line} 行目）`)
  }
  for (const b of blocks) {
    if (!b.closed) err(f, `コードブロックが閉じていません（${b.line} 行目）`)
    if (!b.excerpt && b.section === 'コード' && b.info && fences.includes(b.info.split(/[\s:{[]/)[0])) {
      rule(`「## コード」のコードブロックには :line-numbers=<元ファイルの開始行> を付けてください（${b.line} 行目）`)
    }
  }

  const codeBlocks = excerpts.filter((b) => b.section === 'コード')
  const orig = codeBlocks.find((b) => b.excerpt.title === '原文') ?? codeBlocks.find((b) => !b.excerpt.title)
  const trans = codeBlocks.find((b) => b.excerpt.title === '日本語訳')
  if (!orig) err(f, '「## コード」に引用コード（```<言語>:line-numbers=<開始行>）がありません。翻訳タブを使う場合は [原文] タブが必要です')
  else {
    const ex = orig.excerpt
    if (start && ex.start !== start) err(f, `引用コードの line-numbers=${ex.start} が lines の開始行 ${start} と違います`)
    if (start && end && orig.code.length !== end - start + 1) err(f, `引用コードは ${orig.code.length} 行ですが lines は ${end - start + 1} 行分です（省略せず該当行をそのまま貼ってください）`)
    if (ex.source) err(f, '関数本体の引用（「## コード」の原文）に source 指定は使えません。file を使ってください')
    if (trans) {
      if (trans.excerpt.start !== ex.start) err(f, '[日本語訳] と [原文] の line-numbers が違います')
      const d = compareExcerpt(orig.code, trans.code, e.lang, false)
      if (d >= 0) err(f, `[日本語訳] のコードが [原文] と違います（${ex.start + d} 行目）。変えてよいのはコメントだけで、行数も同じにします\n    原文: ${orig.code[d] ?? '(なし)'}\n    訳:   ${trans.code[d] ?? '(なし)'}`)
      if (!/[ぁ-んァ-ヶ一-龠]/.test(trans.code.join('\n'))) rule('[日本語訳] のコメントが日本語になっていません')
    } else if (hasEnglishComment(orig.code, e.lang)) {
      rule('引用コードに英語のコメントがあります。::: code-group で [日本語訳] と [原文] の 2 タブにしてください')
    }
    // その他の抜粋（解説中の引用・関数外の引用）
    let extraLines = 0
    for (const b of excerpts) {
      if (b === orig || b === trans) continue
      const s0 = b.excerpt.start
      const s1 = s0 + b.code.length - 1
      const inside = !b.excerpt.source && start && end && s0 >= start && s1 <= end
      if (inside) {
        const d = compareExcerpt(orig.code.slice(s0 - start, s1 - start + 1), b.code, e.lang, false)
        if (d >= 0) err(f, `${b.line} 行目のコード引用が元のコードと違います（元ファイル ${s0 + d} 行目）\n    元:   ${orig.code[s0 - start + d] ?? '(なし)'}\n    記事: ${b.code[d] ?? '(なし)'}`)
      } else {
        extraLines += b.code.length
        if (verifySource && SHA_RE.test(fm.commit ?? '')) toVerify.push({ f, fm, file: b.excerpt.source ?? fm.file, code: b.code, start: s0, end: s1, strict: false, where: `${b.line} 行目の引用` })
      }
    }
    if (extraLines > MAX_EXTRA_LINES) err(f, `関数外のコード引用は合計 ${MAX_EXTRA_LINES} 行以内にしてください（現在 ${extraLines} 行）`)
    if (verifySource && start && end && SHA_RE.test(fm.commit ?? '')) toVerify.push({ f, fm, file: fm.file, code: orig.code, start, end, strict: true, where: '引用コード' })
  }

  // 「## 何をしているか」では、説明している部分のコードを引用しながら進める
  const steps = sectionH3(lines, '何をしているか')
  if (!steps.length) rule('「## 何をしているか」は ### で処理のかたまりごとに区切ってください')
  const whatSec = blocks.filter((b) => b.excerpt && b.section === '何をしているか')
  if (!whatSec.length) rule('「## 何をしているか」に、説明しているコードの引用（```<言語>:line-numbers=<行>）がありません。各ステップで該当部分を引用してください')
  // 「100 行目の〜」のような行番号だけの参照は禁止（コードを引用する）
  const proseOnly = body.replace(/```[\s\S]*?```/g, '')
  const lineRef = proseOnly.match(/\d+\s*(?:[〜~-]\s*\d+\s*)?行目/)
  if (lineRef) rule(`「${lineRef[0]}」のような行番号での参照はやめて、該当コードを引用してください`)

  // 解説の分量（コードブロックを除いた文字数）
  const prose = body.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, '')
  if ([...prose].length < 600) err(f, `解説が短すぎます（コード以外 ${[...prose].length} 文字、600 文字以上）`)
  else if ([...prose].length < 1000) warn(f, `解説がやや短めです（コード以外 ${[...prose].length} 文字）`)
}

// ---- 3. 引用コードの照合（--verify-source） --------------------------------
if (toVerify.length) {
  const cache = new Map()
  const fetchRaw = (fm, file) => {
    const [, owner, repo] = fm.repo.match(/github\.com\/([^/]+)\/([^/]+)/)
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${fm.commit}/${file}`
    if (!cache.has(url)) cache.set(url, fetch(url).then(async (r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status} ${url}`)))))
    return cache.get(url)
  }
  const queue = [...toVerify]
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let job; (job = queue.shift()); ) {
      try {
        const src = (await fetchRaw(job.fm, job.file)).split('\n').slice(job.start - 1, job.end)
        const d = compareExcerpt(src, job.code, job.fm.language, job.strict)
        if (d >= 0) err(job.f, `${job.where}が元ファイル（${job.file}）と一致しません（${job.start + d} 行目）\n    元:   ${src[d] ?? '(なし)'}\n    記事: ${job.code[d] ?? '(なし)'}`)
      } catch (e) {
        err(job.f, `元ファイルを取得できません: ${e.message}`)
      }
    }
  }))
}

// ---- 結果 ---------------------------------------------------------------
for (const w of warnings) console.warn(`warn  ${w}`)
for (const e of errors) console.error(`error ${e}`)
const n = entries.filter((e) => inScope(e.relativePath)).length
console.log(`\n${n} 記事を検証: エラー ${errors.length} 件 / 警告 ${warnings.length} 件${verifySource ? `（引用コード照合 ${toVerify.length} 件）` : ''}`)
process.exit(errors.length ? 1 : 0)
