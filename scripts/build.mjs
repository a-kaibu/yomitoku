#!/usr/bin/env node
// 本番ビルド: ハブ + 12 言語を別々に VitePress でビルドし、docs/.vitepress/dist にまとめる。
//   npm run build              # 全部
//   npm run build -- go python # 一部だけ（ハブは常に含む）。確認用
//   npm run build:site -- go   # 1 サイトだけビルド（CI の並列ジョブ用。マージしない）
//   npm run build:merge        # dist-* を dist にまとめるだけ
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { LANGUAGE_IDS } from '../docs/.vitepress/shared.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vp = path.join(root, 'docs', '.vitepress')
const args = process.argv.slice(2)
const mergeOnly = args.includes('--merge-only')
const noMerge = args.includes('--no-merge')
const picked = args.filter((a) => !a.startsWith('--'))
const sites = picked.length ? [...new Set(noMerge ? picked : [...picked, 'hub'])] : [...LANGUAGE_IDS, 'hub']

if (!mergeOnly) {
  for (const site of sites) {
    console.log(`\n=== build: ${site} ===`)
    const r = spawnSync('npx', ['vitepress', 'build', 'docs'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, YK_SITE: site, NODE_OPTIONS: `--max-old-space-size=6144 ${process.env.NODE_OPTIONS ?? ''}` },
    })
    if (r.status !== 0) process.exit(r.status ?? 1)
  }
}
if (noMerge) process.exit(0)

// マージ: 言語 → ハブの順（404.html などはハブのものを残す）。
// アセットはファイル名に内容ハッシュが入っているので、同名なら中身も同じ。
const dist = path.join(vp, 'dist')
fs.rmSync(dist, { recursive: true, force: true })
const parts = fs.readdirSync(vp).filter((d) => d.startsWith('dist-')).sort((a, b) => (a === 'dist-hub') - (b === 'dist-hub'))
if (!parts.includes('dist-hub')) { console.error('dist-hub がありません'); process.exit(1) }
for (const d of parts) fs.cpSync(path.join(vp, d), dist, { recursive: true, force: true })
console.log(`\nmerged ${parts.join(', ')} → docs/.vitepress/dist`)
