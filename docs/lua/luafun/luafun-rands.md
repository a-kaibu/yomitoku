---
title: 範囲の中の乱数を無限に生む rands
description: LuaJIT 向け関数型ライブラリ Lua Fun の rands。指定した範囲の整数の乱数を、無限に返すイテレータを作ります。引数の数によって、範囲の決め方が変わります。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [288, 301]
format: 2
function: rands
difficulty: 2
tags: [乱数, 遅延評価, 防御的プログラミング]
---
## ひとことで

`rands(n, m)` は、整数の乱数を無限に作るイテレータを返す関数です。`rands(m)` と一つだけ渡すと、`0` から `m - 1` の範囲になります。`rands(n, m)` と二つ渡すと、`n` から `m - 1` の範囲になります。値は必要になったときに一つずつ作られるので、無限の列でも問題なく使えます。

## コード

```lua:line-numbers=288
local rands = function(n, m)
    if n == nil and m == nil then
        return wrap(rands_nil_gen, 0, 0)
    end
    assert(type(n) == "number", "invalid first arg to rands")
    if m == nil then
        m = n
        n = 0
    else
        assert(type(m) == "number", "invalid second arg to rands")
    end
    assert(n < m, "empty interval")
    return wrap(rands_gen, {n, m - 1}, 0)
end
```

## 前提知識

- **無限の列**: 終わりのない列です。`take_n` などで、必要な個数だけを取り出して使います。
- **半開区間**: `n` から `m - 1` までの範囲です。上限の `m` は含まれません。`m - 1` を使っているのが、この書き方の意味です。
- **`math.random(a, b)`**: `a` から `b` までの整数の乱数を返す標準関数です。両端を含みます。
- **引数の省略**: `m` が `nil` のときは、`n` を上限として使い、下限は `0` にします。

## 何をしているか

### 1. 引数がなければ、空の乱数列

`n` と `m` の両方が `nil` なら、引数のない `rands_nil_gen` を使う列を作ります。範囲の指定が、まったくないときの扱いです。

```lua:line-numbers=289
    if n == nil and m == nil then
        return wrap(rands_nil_gen, 0, 0)
    end
```

### 2. 一つだけなら、下限を 0 にする

`m` が `nil` のときは、渡された `n` を上限にします。下限は `0` とみなします。

```lua:line-numbers=293
    if m == nil then
        m = n
        n = 0
```

### 3. 範囲が空でないか確かめ、列を作る

`n < m` でなければ、範囲が空なので `assert` でエラーにします。問題なければ、`{n, m - 1}` を材料にして、無限の乱数列を作ります。

```lua:line-numbers=299
    assert(n < m, "empty interval")
    return wrap(rands_gen, {n, m - 1}, 0)
```

## ここがすごい

- **引数の数で書き方が変わる**: 上限だけの指定と、範囲の指定を、同じ関数で扱えます。短く書けるのが利点です。
- **半開区間を内部で使う**: 上限を `m - 1` にして、両端を含む形で乱数を作ります。範囲の境界を、一か所で正しく扱っています。
- **無限の列として遅延**: 乱数は、使うまで作られません。必要な数だけ、必要なときに取り出せます。
- **注意点**: 乱数の種を設定しないと、毎回同じ並びが出ることがあります。また、範囲が空のときは、必ずエラーになります。

## まとめ

- 範囲の指定を、引数の数で切り替えると、短い呼び出しと詳しい指定の両方に対応できる。
- 範囲の上限を含めるかどうかは、一つの決まりに揃えると、境界のずれを防げる。
- 乱数の列は、遅延で作ると、無限の列でも必要な分だけ安全に使える。
