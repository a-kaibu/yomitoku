---
title: 同じ入力の答えを覚える、memoize の 10 行
description: Lua のユーティリティ集 Penlight の utils.memoize。関数の結果を表に覚えておき、同じ引数で呼ばれたら、計算せずに覚えた答えを返します。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [760, 770]
format: 2
function: utils.memoize
difficulty: 1
tags: [キャッシュ, クロージャ, 最適化]
---
## ひとことで

`utils.memoize(func)` は、1 つの引数を取る関数 `func` を、「一度計算した答えを覚える版」に包み直す関数です。同じ引数で 2 回目に呼ばれたら、計算をやり直さず、覚えた答えを返します。計算に時間がかかる関数を、速くするための小さな仕組みです。

## コード

```lua:line-numbers=760
function utils.memoize(func)
    local cache = {}
    return function(k)
        local res = cache[k]
        if res == nil then
            res = func(k)
            cache[k] = res
        end
        return res
    end
end
```

## 前提知識

- **メモ化（memoization）**: 一度計算した結果を覚えておき、同じ入力が来たら使い回す手法です。覚える場所は、普通は表です。
- **クロージャ**: 関数の中で作られた関数が、外側の変数（ここでは `cache` と `func`）を覚えたまま使い続けられる仕組みです。
- **`nil` と `false` の違い**: Lua では、`false` も値として使えます。ここでは `res == nil` で確かめているので、覚えた値が `false` でも、きちんと使い回せます。
- **表をキーに使う**: 表のキーには、数や文字列を使えます。この関数では、引数 `k` をそのままキーにしています。

## 何をしているか

### 1. 覚えておく表を作る

```lua:line-numbers=761
    local cache = {}
```

`cache` は、答えを覚えておく空の表です。`memoize` が呼ばれたときに一度だけ作られ、返された関数の中で、ずっと使われます。

### 2. 覚えていれば、そのまま返す

```lua:line-numbers=762
    return function(k)
        local res = cache[k]
        if res == nil then
```

包まれた関数は、まず `cache[k]` を探します。`nil` でなければ、前に覚えた答えがあるので、それを返します。計算は行いません。

### 3. 無ければ計算して、覚えてから返す

```lua:line-numbers=765
            res = func(k)
            cache[k] = res
        end
        return res
```

`res` が `nil` なら、`func(k)` を呼んで答えを計算します。その答えを `cache[k]` に入れてから、`res` を返します。次に同じ `k` で呼ばれたときは、覚えた答えが使われます。

## ここがすごい

- **書き換えが少ない**: 元の関数 `func` は、一切変更されません。包むだけで、速さが手に入ります。
- **仕組みがとても単純**: 表とクロージャだけで書かれているので、何が起きているかを追うのが簡単です。
- **`nil` の判定で十分**: 覚える答えが `false` でも、`nil` と区別できるので、正しく動きます。
- **注意点**: 覚えた答えは、消えずに増え続けます。引数の種類が多いと、表が大きくなるので、メモリの使用量に注意してください。また、引数は 1 つだけを想定しています。

## まとめ

- 同じ入力に同じ答えを返す関数は、結果を表に覚えると速くなる。
- 覚えておく仕組みは、クロージャで包むと、元の関数を変えずに足せる。
- 覚える値が `false` の場合も考えて、`nil` かどうかで判定する。
