---
title: nil の穴も数えて値を返す、unpack の既定値
description: Lua のユーティリティ集 Penlight の utils.unpack。表の値を、複数の戻り値として返します。範囲の既定値は、表の n の項目を優先して使うので、途中に nil があっても正しく返せます。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [80, 82]
format: 2
function: utils.unpack
difficulty: 2
tags: [データ構造, 防御的プログラミング, 標準ライブラリ]
---
## ひとことで

`utils.unpack(t, i, j)` は、表 `t` の `i` 番目から `j` 番目までの値を、複数の戻り値として返す関数です。`i` と `j` を省くと、全体の範囲を使います。`j` の既定値に、表の `n` という項目を優先して使うのが特徴です。途中に `nil` が含まれる表でも、正しい個数の値を返せます。

## コード

```lua:line-numbers=80
function utils.unpack(t, i, j)
    return _unpack(t, i or 1, j or t.n or #t)
end
```

## 前提知識

- **`table.unpack` と `unpack`**: 表の値を、複数の戻り値として展開する関数です。Lua のバージョンによって、名前や場所が違います。`_unpack` は、その違いを吸収した名前です。
- **`#t` の限界**: 長さの演算子は、表に `nil` の穴があると、正しい長さを返さないことがあります。穴のある表では、この値は当てになりません。
- **`t.n`**: 表に入れた要素の個数を、明示的に持たせる慣習です。`table.pack` は、この `n` を自動で付けます。
- **既定値 `or`**: `i or 1` は、`i` が `nil` のときに `1` を使う書き方です。省略された引数の代わりになります。

## 何をしているか

### 1. 範囲の既定値を決める

`i` が省略されたときは `1` を使います。`j` が省略されたときは、`t.n`、それもなければ `#t` を使います。`t.n` を先に見るので、穴のある表でも、入れた個数の分だけ返せます。

```lua:line-numbers=81
    return _unpack(t, i or 1, j or t.n or #t)
```

### 2. 内部の unpack に任せる

決めた範囲を、`_unpack` に渡して、値を複数の戻り値として返します。実際の展開は、Lua の標準の仕組みが行います。

```lua:line-numbers=81
    return _unpack(t, i or 1, j or t.n or #t)
```

## ここがすごい

- **穴に強い**: `#t` は穴があると、短い長さを返すことがあります。`t.n` を優先するので、個数を正しく扱えます。
- **省略の形が自然**: `i` と `j` を省けるので、全部を返したいときは、表だけを渡せば済みます。
- **環境の違いを隠す**: `_unpack` の名前は、Lua の版によって違うものを一か所で吸収します。呼ぶ側は、版を気にせずに使えます。
- **注意点**: 値が多すぎると、Lua の戻り値の上限に達して、エラーになることがあります。大きな表を一度に展開するのは避けてください。

## まとめ

- 穴のある表の個数は、長さの演算子ではなく、個数を持たせた `n` で扱うと正しい。
- 省略できる範囲は、既定値を `or` で決めると、呼び出しが簡単になる。
- 大きな表の展開は、戻り値の上限を意識して、分けて扱う。
