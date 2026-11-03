---
title: 可変長引数を「あるかどうか」の表に変える 6 行
description: JSON ライブラリ json.lua の小さな補助関数。並べた値を検索用のテーブルにまとめ、文字列の判定を一瞬で済ませる仕掛けを読みます。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [145, 151]
format: 2
function: create_set
difficulty: 1
tags: [データ構造, イディオム, パース]
---

## ひとことで

`create_set` は、引数に並べた値をすべて「入っている」印の付いたテーブルに変える関数です。`create_set(" ", "\t")` と呼ぶと、`" "` と `"\t"` を調べるための表ができあがります。JSON を読むときに「この文字は空白か」「この単語は `true` `false` `null` のどれか」を、ループなしで 1 回の参照で調べるために使われています。

## コード

```lua:line-numbers=145
local function create_set(...)
  local res = {}
  for i = 1, select("#", ...) do
    res[ select(i, ...) ] = true
  end
  return res
end
```

## 前提知識

- **テーブル**: Lua で唯一のデータ構造です。配列にも辞書にも使え、`t[key] = value` で値を入れ、`t[key]` で取り出します。
- **可変長引数 `...`**: 関数の引数をいくつでも受け取る書き方です。`...` の中身は `select` で取り出します。
- **`select("#", ...)`**: 引数の個数を返します。`select(i, ...)` は `i` 番目の引数を返します。
- **集合（set）**: 「同じ値が入っているか」だけを知りたいときに使うデータです。値そのものは必要なく、キーの有無だけで判断します。

## 何をしているか

### 1. 引数を 1 つずつ取り出す

`for i = 1, select("#", ...)` で、引数の個数だけ繰り返します。`select(i, ...)` は `i` 番目の引数だけを返すので、`for` の中で 1 つずつ順番に扱えます。

```lua:line-numbers=147
  for i = 1, select("#", ...) do
```

### 2. 値をキーにして `true` を入れる

取り出した値を **キー** にして、値に `true` を入れます。キーは `" "` や `"\t"` のように文字列でも、`nil` 以外なら何でも使えます。

```lua:line-numbers=148
    res[ select(i, ...) ] = true
```

たとえば `create_set(" ", "\t", "\r", "\n")` を実行すると、テーブルは次のような形になります。

```lua
{ [" "] = true, ["\t"] = true, ["\r"] = true, ["\n"] = true }
```

### 3. 判定は「キーがあるか」を見るだけ

できた表を使うと、判定は `space_chars[c]` と書くだけになります。`c` が空白なら `true`、そうでなければ `nil` が返ります。ループで全部の候補と比べる必要がなく、比較の回数は候補の数に関係なく 1 回です。

```lua:line-numbers=153
local space_chars   = create_set(" ", "\t", "\r", "\n")
```

## ここがすごい

- **判定の書き方が単純になる**: 「空白かどうか」を `c == " " or c == "\t" or ...` と書く代わりに、表を 1 回作っておけば `space_chars[c]` だけで済みます。候補を増やしても判定の行は変わりません。
- **作る処理が 1 か所にまとまる**: 同じ形の表を `create_set` で量産しているので、`space_chars`、`delim_chars`、`escape_chars`、`literals` の 4 つが同じ書き方で並んでいます。読む人は 1 つ理解すれば全部わかります。
- **トレードオフ**: 表を作る時間とメモリが少しかかります。ただし JSON の読み込みで何百万回も判定するのに比べると、表を作るのは最初の 1 回だけです。

## まとめ

- 値の集まりから「入っているか」を調べる表は、キーに値を入れて `true` を置くと作れる。
- 判定をループから辞書の参照に置き換えると、コードも速度も単純になる。
- `select("#", ...)` と `select(i, ...)` で、可変長引数を 1 つずつ扱える。
