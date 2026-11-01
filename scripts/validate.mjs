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

  // 「## コード」直後の最初のコードブロックが引用コード
  const codeIdx = lines.findIndex((l) => /^##\s+コード\s*$/.test(l))
  if (codeIdx >= 0) {
    const open = lines.findIndex((l, i) => i > codeIdx && /^```/.test(l))
    const nextH2 = lines.findIndex((l, i) => i > codeIdx && /^##\s/.test(l))
    if (open < 0 || (nextH2 >= 0 && open > nextH2)) err(f, '「## コード」にコードブロックがありません')
    else {
      const info = lines[open].slice(3).trim()
      const m = info.match(/^([\w+#-]+):line-numbers=(\d+)$/)
      const fences = LANGUAGES.find((l) => l.id === e.lang)?.fences ?? []
      if (!m) err(f, `引用コードのフェンスは \`\`\`${fences[0]}:line-numbers=${start ?? '<開始行>'} の形にしてください（現在: "${info}"）`)
      else {
        if (!fences.includes(m[1])) err(f, `コードブロックの言語 "${m[1]}" は ${fences.join(', ')} のどれかにしてください`)
        if (start && Number(m[2]) !== start) err(f, `line-numbers=${m[2]} が lines の開始行 ${start} と違います`)
      }
      const close = lines.findIndex((l, i) => i > open && /^```\s*$/.test(l))
      if (close < 0) err(f, '引用コードのブロックが閉じていません')
      else {
        const code = lines.slice(open + 1, close)
        if (start && end && code.length !== end - start + 1) err(f, `引用コードは ${code.length} 行ですが lines は ${end - start + 1} 行分です（省略せず該当行をそのまま貼ってください）`)
        if (verifySource && start && end && SHA_RE.test(fm.commit ?? '')) toVerify.push({ f, fm, code, start, end })
      }
    }
  }

  // 解説の分量（コードブロックを除いた文字数）
  const prose = body.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, '')
  if ([...prose].length < 600) err(f, `解説が短すぎます（コード以外 ${[...prose].length} 文字、600 文字以上）`)
  else if ([...prose].length < 1000) warn(f, `解説がやや短めです（コード以外 ${[...prose].length} 文字）`)
}

// ---- 3. 引用コードの照合（--verify-source） --------------------------------
if (toVerify.length) {
  const cache = new Map()
  const fetchRaw = (fm) => {
    const [, owner, repo] = fm.repo.match(/github\.com\/([^/]+)\/([^/]+)/)
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${fm.commit}/${fm.file}`
    if (!cache.has(url)) cache.set(url, fetch(url).then(async (r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status} ${url}`)))))
    return cache.get(url)
  }
  const queue = [...toVerify]
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let job; (job = queue.shift()); ) {
      try {
        const src = (await fetchRaw(job.fm)).split('\n').slice(job.start - 1, job.end)
        const norm = (s) => s.replace(/\s+$/, '')
        const diff = src.findIndex((l, i) => norm(l) !== norm(job.code[i] ?? ''))
        if (diff >= 0) err(job.f, `引用コードが元ファイルと一致しません（${job.start + diff} 行目）\n    元: ${src[diff]}\n    記事: ${job.code[diff]}`)
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
