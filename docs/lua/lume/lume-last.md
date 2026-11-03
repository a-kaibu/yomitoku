---
title: 末尾の数個だけを取り出す、負の範囲による last
description: Lua の小さなユーティリティ集 lume の last。負の位置で範囲を指定する slice を使い、配列の末尾から n 個を一度に取り出します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [430, 433]
format: 2
function: lume.last
difficulty: 1
tags: [データ構造, 標準ライブラリ, イディオム]
---

## ひとことで

`lume.last(t, n)` は、配列の最後の要素、または末尾から `n` 個の要素を返す関数です。`n` を省略すると最後の 1 つを返し、指定すると新しい配列を返します。前の記事の `slice` を使って書かれているので、とても短くなっています。

## コード

```lua:line-numbers=430
function lume.last(t, n)
  if not n then return t[#t] end
  return lume.slice(t, -n, -1)
end
```

## 前提知識

- **`slice`**: 配列の範囲を切り出す lume の関数です。負の位置は末尾からの数として扱われます。
- **負の位置 `-n`**: `n` が 3 なら `-3` で、末尾から 3 番目の位置を表します。
- **`-1`**: 末尾の位置です。範囲の終わりに指定すると、最後の要素まで含みます。

## 何をしているか

### 1. 数が省略されたら、最後の 1 つを返す

`n` が `nil` のときは、`t[#t]` で最後の要素をそのまま返します。配列が空なら `nil` です。

```lua:line-numbers=431
  if not n then return t[#t] end
```

### 2. 末尾から n 個を範囲で指定する

`lume.slice(t, -n, -1)` は、末尾から `n` 番目から最後までを切り出します。`n` が 3 なら、末尾の 3 つになります。

```lua:line-numbers=432
  return lume.slice(t, -n, -1)
```

## ここがすごい

- **範囲の指定だけで書ける**: 末尾の数え方を `slice` に任せるので、`last` 自身は 1 行で済みます。
- **同じ部品を組み合わせる**: `first` は `slice(t, 1, n)`、`last` は `slice(t, -n, -1)` で、対になる形になっています。
- **注意点**: `n` が配列の長さより大きいと、`slice` が範囲を内側に収めるので、配列全体が返ります。エラーにはなりません。

## まとめ

- 末尾の数個を取るには、負の位置で範囲を指定すると 1 行で書ける。
- 先頭と末尾を対にした関数は、同じ部品から作ると分かりやすい。
