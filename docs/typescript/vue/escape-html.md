---
title: "危険な文字だけを切り出して直す HTML エスケープ"
description: "Vue が文字列を HTML に埋め込むときに使う escapeHtml。`&` `<` `>` `\"` `'` の 5 文字を探し、変換が必要な部分だけを順に組み立てる。何もなければ元の文字列をそのまま返す。"
language: typescript
project: "Vue.js"
repo: https://github.com/vuejs/core
license: MIT
copyright: "Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors"
commit: "24c9d0bffb2299635b8112a978d74a38723aaa10"
file: packages/shared/src/escapeHtml.ts
lines: [3, 45]
function: "escapeHtml"
difficulty: 2
format: 2
tags: [セキュリティ, 文字列処理, 最適化]
---

## ひとことで

`escapeHtml(value)` は、文字列を HTML に埋め込んでも壊れず、悪用されないように、`"`、`&`、`'`、`<`、`>` の 5 文字を **実体参照**（`&lt;` のような書き方）に置き換える関数です。

```ts
escapeHtml('<b>Tom & "Jerry"</b>')
// '&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;'
```

ユーザーの入力をそのまま HTML に入れると、`<script>` を仕込まれる攻撃（XSS）につながります。この関数はその基本的な対策です。

## コード

```ts:line-numbers=3
export function escapeHtml(string: unknown): string {
  const str = '' + string
  const match = escapeRE.exec(str)

  if (!match) {
    return str
  }

  let html = ''
  let escaped: string
  let index: number
  let lastIndex = 0
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escaped = '&quot;'
        break
      case 38: // &
        escaped = '&amp;'
        break
      case 39: // '
        escaped = '&#39;'
        break
      case 60: // <
        escaped = '&lt;'
        break
      case 62: // >
        escaped = '&gt;'
        break
      default:
        continue
    }

    if (lastIndex !== index) {
      html += str.slice(lastIndex, index)
    }

    lastIndex = index + 1
    html += escaped
  }

  return lastIndex !== index ? html + str.slice(lastIndex, index) : html
}
```

ファイル先頭の `escapeRE`（`/["'&<>]/`）は、5 文字のどれかを含むかを調べる正規表現です。

## 前提知識

- **`'' + string`**: 空文字列との足し算で、どんな値も文字列に変換します。`null` は `'null'`、数値 `1` は `'1'` になります。
- **`RegExp#exec`**: 正規表現に最初に一致した位置の情報を返します。一致しなければ `null` です。
- **`charCodeAt(i)`**: `i` 番目の文字の文字コード（数値）を返します。`"` は 34、`&` は 38 です。
- **`switch` と `continue`**: `default` で `continue` を書くと、置き換えの必要がない文字はループの次の回に進みます。
- **`slice(a, b)`**: `a` 以上 `b` 未満の部分文字列を返します。

## 何をしているか

### 1. 変換が要るかを先に確かめる

```ts:line-numbers=7
  if (!match) {
    return str
  }
```

5 文字のどれも含まれなければ、そのまま返します。普通の文章の大半はここで終わります。

### 2. 最初の危険な文字から処理を始める

```ts:line-numbers=15
  for (index = match.index; index < str.length; index++) {
```

`match.index` は最初に見つかった危険な文字の位置です。それより前は変換の必要がないので、最初からなめる必要はありません。

### 3. 置き換えと、そのあいだの文字をつなぐ

```ts:line-numbers=36
    if (lastIndex !== index) {
      html += str.slice(lastIndex, index)
    }

    lastIndex = index + 1
    html += escaped
```

`lastIndex` は「まだ出力していない部分の先頭」です。危険な文字を見つけたら、その手前の普通の部分をまとめて出力し、置き換え後の文字を追加します。

`<a>` を例に追ってみます。

```
index=0 '<' → lastIndex=0 なので手前は出力なし。'&lt;' を追加。lastIndex=1
index=2 '>' → 手前の 'a' を出力 → 'a'。'&gt;' を追加。lastIndex=3
```

### 4. 最後の残りを出力する

```ts:line-numbers=44
  return lastIndex !== index ? html + str.slice(lastIndex, index) : html
```

最後の危険な文字より後ろの部分を足して返します。

## ここがすごい

- **1 回の走査で完結する**: `replace` を 5 回つなぐ方法だと、文字列を 5 回なめることになります。しかも `&` を先に置き換えないと、あとから作った `&lt;` の `&` まで二重に変換されてしまいます。この実装は 1 回の走査で 1 文字ずつ判定するので、その順番の問題が起きません。
- **変換しない部分は、まとめてコピーする**: 危険な文字と文字の間は `slice` で一度に切り出します。1 文字ずつ連結すると、長い文章ほど遅くなります。
- **最初の一致を正規表現で探す**: 普通の文字列はそもそも変換がないので、`exec` で最初の一致が見つからなければ、ループに入る前に返します。
- **`switch` の番号は文字コード**: `case 34:` のように数値で比べると、文字列の比較より速く、`// "` のようにコメントで文字を添えて読みやすさを保っています。

## まとめ

- HTML に埋め込む文字列は、`& < > " '` の 5 文字を実体参照に変える。
- 置き換えは 1 回の走査で行うと、`&` の二重変換のような順番の事故が起きない。
- 変換の必要がない文字列は、早めに元の文字列を返すと速い。
