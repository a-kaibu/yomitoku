// コード抜粋の共通処理（ビルドと検証の両方で使う。Node 専用 import を書かないこと）

/** 共通の先頭インデントを取り除く（空行は無視）。タブとスペースは文字としてそのまま比較する */
export function dedent(lines) {
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0])
  if (!indents.length) return lines.slice()
  let common = indents[0]
  for (const ind of indents) {
    let i = 0
    while (i < common.length && i < ind.length && common[i] === ind[i]) i++
    common = common.slice(0, i)
  }
  return lines.map((l) => (l.startsWith(common) ? l.slice(common.length) : l.trimStart()))
}

/** 言語ごとのコメント・文字列の書き方 */
const C_LIKE = { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] }
export const COMMENT_SYNTAX = {
  c: C_LIKE,
  cpp: C_LIKE,
  go: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] },
  rust: { line: ['//'], block: [['/*', '*/']], quotes: ['"'] }, // ' はライフタイムと区別できないので扱わない
  csharp: C_LIKE,
  typescript: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] },
  swift: { line: ['//'], block: [['/*', '*/']], quotes: ['"'] },
  kotlin: C_LIKE,
  java: C_LIKE,
  shell: { line: ['#'], block: [], quotes: ['"', "'"], hashNeedsSpace: true },
  python: { line: ['#'], block: [['"""', '"""'], ["'''", "'''"]], quotes: ['"', "'"] },
  // Ruby の `#{...}` は式展開（正規表現リテラルの中にも出てくる）なのでコメントにしない（hashNot）
  ruby: { line: ['#'], block: [['=begin', '=end']], quotes: ['"', "'"], hashNot: '{' },
  // PHP の `#[...]` はアトリビュート（コメントではない）
  php: { line: ['//', '#'], block: [['/*', '*/']], quotes: ['"', "'"], hashNot: '[' },
  lua: { line: ['--'], block: [['--[[', ']]']], quotes: ['"', "'"] },
  zig: { line: ['//'], block: [], quotes: ['"', "'"] },
  erlang: { line: ['%'], block: [], quotes: ['"', "'"] },
  // Haskell の ' は識別子にも使う（x' など）ので文字列扱いしない
  haskell: { line: ['--'], block: [['{-', '-}']], quotes: ['"'] },
  sql: { line: ['--'], block: [['/*', '*/']], quotes: ['"', "'"] },
  css: { line: [], block: [['/*', '*/']], quotes: ['"', "'"] },
  hcl: { line: ['#', '//'], block: [['/*', '*/']], quotes: ['"'] },
}

/**
 * 各行を「コード部分」と「コメント部分」に分ける。
 * 厳密なパーサではなく、コメント翻訳でコードが変わっていないかを確かめるための近似。
 * 戻り値: { code: string, comment: string }[]
 */
export function splitComments(lines, lang) {
  const syn = COMMENT_SYNTAX[lang] ?? C_LIKE
  let inBlock = null // 閉じ記号
  const out = []
  for (const line of lines) {
    let code = ''
    let comment = ''
    let i = 0
    let quote = null
    while (i < line.length) {
      const rest = line.slice(i)
      if (inBlock) {
        const end = rest.indexOf(inBlock)
        if (end < 0) { comment += rest; i = line.length; break }
        comment += rest.slice(0, end + inBlock.length)
        i += end + inBlock.length
        inBlock = null
        continue
      }
      if (quote) {
        if (rest[0] === '\\') { code += rest.slice(0, 2); i += 2; continue }
        if (rest[0] === quote) quote = null
        code += rest[0]
        i++
        continue
      }
      const blk = syn.block.find(([open]) => rest.startsWith(open) && (open !== '=begin' || i === 0))
      if (blk) { comment += blk[0]; i += blk[0].length; inBlock = blk[1]; continue }
      const lc = syn.line.find((m) => rest.startsWith(m))
      if (lc && !(syn.hashNot && rest[0] === '#' && rest[1] === syn.hashNot) && (!syn.hashNeedsSpace || i === 0 || /\s/.test(line[i - 1]))) { comment += rest; break }
      if (syn.quotes.includes(rest[0])) quote = rest[0]
      code += rest[0]
      i++
    }
    out.push({ code, comment })
  }
  return out
}

/** コメントに英字が含まれるか（＝翻訳が必要そうか） */
export function hasEnglishComment(lines, lang) {
  return splitComments(lines, lang).some((p) => /[A-Za-z]{3,}/.test(p.comment) && !/[ぁ-んァ-ヶ一-龠]/.test(p.comment))
}

/**
 * 2 つの抜粋を比べる。strict なら完全一致（デデント・行末空白を除く）、
 * そうでなければコメント部分の違いは許容してコード部分だけ比べる。
 * 一致すれば -1、違えば最初に違う行の添字を返す。
 */
export function compareExcerpt(original, shown, lang, strict) {
  const a = dedent(original).map((l) => l.replace(/\s+$/, ''))
  const b = dedent(shown).map((l) => l.replace(/\s+$/, ''))
  const n = Math.max(a.length, b.length)
  if (strict) {
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i
    return -1
  }
  if (a.length !== b.length) return Math.min(a.length, b.length)
  const ca = splitComments(a, lang)
  const cb = splitComments(b, lang)
  const norm = (s) => s.replace(/\s+/g, ' ').trim()
  for (let i = 0; i < n; i++) if (a[i] !== b[i] && norm(ca[i].code) !== norm(cb[i].code)) return i
  return -1
}
