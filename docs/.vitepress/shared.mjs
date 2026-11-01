// ヨクヨム: クライアントとビルドの両方で使う定数（Node 専用の import を書かないこと）。
// 言語スレッドはこのファイルを編集しないでください。

/** 対応言語。id はディレクトリ名（docs/<id>/）。fences はコードブロックに使える言語名。 */
export const LANGUAGES = [
  { id: 'c', name: 'C', fences: ['c'], color: '#5c6bc0', blurb: 'OS・組み込み・言語処理系の土台' },
  { id: 'cpp', name: 'C++', fences: ['cpp'], color: '#00599c', blurb: 'ゼロコスト抽象化とテンプレート' },
  { id: 'go', name: 'Go', fences: ['go'], color: '#00add8', blurb: 'シンプルさと並行処理' },
  { id: 'rust', name: 'Rust', fences: ['rust'], color: '#ce422b', blurb: '所有権で安全と速さを両立' },
  { id: 'csharp', name: 'C#', fences: ['csharp', 'cs'], color: '#68217a', blurb: '.NET と高性能なマネージドコード' },
  { id: 'typescript', name: 'TypeScript', fences: ['ts', 'typescript', 'tsx'], color: '#3178c6', blurb: '型で JavaScript を設計する' },
  { id: 'swift', name: 'Swift', fences: ['swift'], color: '#f05138', blurb: 'Apple プラットフォームと値型' },
  { id: 'kotlin', name: 'Kotlin', fences: ['kotlin', 'kt'], color: '#7f52ff', blurb: '簡潔な JVM 言語とコルーチン' },
  { id: 'java', name: 'Java', fences: ['java'], color: '#e76f00', blurb: '巨大システムを支える堅牢さ' },
  { id: 'shell', name: 'シェルスクリプト', fences: ['sh', 'bash', 'shell', 'zsh'], color: '#4eaa25', blurb: 'コマンドをつなぐ小さな魔法' },
  { id: 'python', name: 'Python', fences: ['python', 'py'], color: '#3776ab', blurb: '読みやすさと強力な標準ライブラリ' },
  { id: 'ruby', name: 'Ruby', fences: ['ruby', 'rb'], color: '#cc342d', blurb: '楽しさとメタプログラミング' },
]

export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id)

/** 難易度（frontmatter の difficulty） */
export const DIFFICULTIES = { 1: '入門', 2: '中級', 3: '上級' }

/** 使えるタグ（固定語彙）。ここに無いタグは検証で落ちます。 */
export const TAGS = [
  'ビット演算', '最適化', 'メモリ管理', 'データ構造', 'アルゴリズム', '並行処理',
  '非同期', 'エラー処理', '文字列処理', 'Unicode', '型システム', 'ジェネリクス',
  'メタプログラミング', 'マクロ', '関数型', '設計パターン', 'API設計', '遅延評価',
  'キャッシュ', 'ハッシュ', 'ソート', '探索', 'パース', '数値計算', '乱数',
  '入出力', 'ファイル', 'ネットワーク', 'セキュリティ', '暗号', '防御的プログラミング',
  'イディオム', '標準ライブラリ', '低レイヤ', 'システムコール', 'コンパイラ', 'インタプリタ',
  'テスト', 'ログ', '可読性', 'ハック', '移植性', 'ロック不要', '再帰', 'イテレータ',
  'クロージャ', 'リフレクション', '日時', '正規表現', 'CLI', '状態機械', 'GC',
]

/**
 * 掲載を許可するライセンス（SPDX 識別子）。
 * OSI 承認の OSS ライセンスに限ります。SSPL / BUSL / Elastic License など
 * ソースは見られても OSS ではないものは掲載しません。
 */
export const LICENSES = [
  'MIT', 'MIT-0', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD',
  'MPL-2.0', 'EPL-2.0', 'Zlib', 'BSL-1.0', 'Unlicense', 'CC0-1.0',
  'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later',
  'LGPL-2.1-only', 'LGPL-2.1-or-later', 'LGPL-3.0-only', 'LGPL-3.0-or-later',
  'AGPL-3.0-only', 'AGPL-3.0-or-later',
  'PSF-2.0', 'Python-2.0', 'Ruby', 'BSD-2-Clause OR Ruby', 'Artistic-2.0', 'PostgreSQL',
  'curl', 'OpenSSL', 'Apache-2.0 WITH LLVM-exception', 'MIT OR Apache-2.0', 'Apache-2.0 OR MIT',
]

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SHA_RE = /^[0-9a-f]{40}$/

/** 本文に必須の見出し（この順番で、この表記で） */
export const REQUIRED_HEADINGS = ['ひとことで', 'コード', '前提知識', '何をしているか', 'ここがすごい', 'まとめ']

/** コード抜粋の最大行数 */
export const MAX_EXCERPT_LINES = 80

/** GitHub の固定リンクを組み立てる */
export function sourceUrl(fm) {
  const [start, end] = fm.lines ?? []
  const anchor = start ? (end && end !== start ? `#L${start}-L${end}` : `#L${start}`) : ''
  return `${String(fm.repo).replace(/\/$/, '')}/blob/${fm.commit}/${fm.file}${anchor}`
}

