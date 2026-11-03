---
title: 引数の組み合わせを木の形で覚える、memoize の仕掛け
description: Lua の小さなユーティリティ集 lume の memoize。引数を 1 つずつ「たどる表」に変えて、同じ引数の計算結果を使い回します。nil を別の印に置き換える工夫も読みます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [492, 504]
format: 2
function: lume.memoize
difficulty: 2
tags: [キャッシュ, 関数型, クロージャ]
---

## ひとことで

`lume.memoize(fn)` は、関数 `fn` を「同じ引数で呼ばれたら前の答えを返す」版に包み直す関数です。計算が重い関数でも、同じ入力に対しては 2 回目以降ほぼ一瞬で結果が返ります。引数が 1 つでも 3 つでも、どの組み合わせも同じ仕組みで覚えられるのがポイントです。

## コード

```lua:line-numbers=492
function lume.memoize(fn)
  local cache = {}
  return function(...)
    local c = cache
    for i = 1, select("#", ...) do
      local a = select(i, ...) or memoize_nil
      c[a] = c[a] or {}
      c = c[a]
    end
    c[memoize_fnkey] = c[memoize_fnkey] or {fn(...)}
    return unpack(c[memoize_fnkey])
  end
end
```

関数の外にある 2 つの「印」も、読むのに必要なので引用します。

```lua:line-numbers=489
local memoize_fnkey = {}
local memoize_nil = {}
```

## 前提知識

- **クロージャ**: 関数の中で作った関数が、外側の変数（ここでは `cache`）を覚えたまま使い続けられる仕組みです。`lume.memoize` は `cache` を持った関数を返します。
- **テーブルをキーにする**: Lua のテーブルは、文字列や数字だけでなくテーブルや関数もキーにできます。ただし `nil` はキーにできません。
- **`unpack`**: テーブルの中身を複数の戻り値として返す関数です。Lua 5.2 以降の `table.unpack` と同じものです。
- **`or` の性質**: `a or b` は `a` が `nil` か `false` なら `b` を返します。この性質で「値がないときの代わり」を書けます。

## 何をしているか

### 1. 引数を「たどる木」として使う

`cache` は、引数の値を順番にキーとしてたどっていく木の形をしたテーブルです。引数が `(1, "a")` なら `cache[1]["a"]` という場所に結果を置きます。こうすると、引数の数や種類が違っても、同じ組み合わせは必ず同じ場所にたどり着きます。

```lua:line-numbers=495
    local c = cache
    for i = 1, select("#", ...) do
      local a = select(i, ...) or memoize_nil
      c[a] = c[a] or {}
      c = c[a]
    end
```

### 2. `nil` の引数は「印」に置き換える

テーブルのキーに `nil` は使えません。引数が `nil` のときに備えて、`or memoize_nil` で別の値に置き換えます。`memoize_nil` は空のテーブル `{}` で、ただの印として使われています。

```lua:line-numbers=497
      local a = select(i, ...) or memoize_nil
```

### 3. 結果を覚えて、次回から使う

たどり着いた場所に `memoize_fnkey` というキーで結果を入れます。すでに結果があれば `fn` は呼ばれず、そのまま返されます。結果は `{fn(...)}` のように配列で包んでおくので、戻り値が複数あっても全部覚えられます。

```lua:line-numbers=501
    c[memoize_fnkey] = c[memoize_fnkey] or {fn(...)}
```

最後の `unpack` で、覚えておいた戻り値を元の形で返します。

## ここがすごい

- **引数の数に制限がない**: 引数が何個あっても、木を 1 段ずつ深くするだけで対応できます。引数を連結して文字列のキーを作る方法だと、`("a,b", "c")` と `("a", "b,c")` が同じキーになるような衝突が起きます。木の形ならそれが起きません。
- **`nil` と「値がない」を区別する工夫**: 印を 1 つ用意するだけで `nil` を扱えます。`memoize_nil` は空テーブルなので、他のどの値とも同じになりません。
- **戻り値を全部覚える**: `{fn(...)}` で包むことで、複数の戻り値も正しく再現できます。1 つだけ覚える単純な実装では、この挙動は失われます。
- **トレードオフ**: 覚えた結果は捨てられないので、引数の種類が無限に多い場合はメモリが増え続けます。使いどころは、引数の種類が限られた計算に限られます。

## まとめ

- 引数の組み合わせは、テーブルを一段ずつたどる木として覚えると衝突がない。
- `nil` は「印」に置き換えると、テーブルのキーとして安全に扱える。
- 戻り値は配列に包んで覚えると、複数の戻り値もそのまま再現できる。
