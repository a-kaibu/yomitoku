---
title: 最初の引数を先に固定して、関数を部分的に使う
description: Lua のユーティリティ集 Penlight の utils.bind1。関数の 1 番目の引数を値に固定し、残りの引数だけを受け取る新しい関数を作ります。部分適用という考え方の基本です。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [827, 830]
format: 2
function: utils.bind1
difficulty: 2
tags: [関数型, クロージャ, イディオム]
---

## ひとことで

`utils.bind1(fn, p)` は、関数 `fn` の最初の引数を `p` に固定した、新しい関数を返します。`f(a, b, c)` を `bind1(f, "world")` で包むと、新しい関数は `b` と `c` だけを受け取り、`f("world", b, c)` を呼びます。毎回同じ値を渡す手間を省けるので、コールバックの準備によく使われます。

## コード

```lua:line-numbers=827
function utils.bind1 (fn,p)
    fn = utils.function_arg(1,fn)
    return function(...) return fn(p,...) end
end
```

## 前提知識

- **部分適用（partial application）**: 関数の引数の一部を先に決めて、残りを受け取る新しい関数を作ることです。
- **クロージャ**: 関数が外側の変数（ここでは `fn` と `p`）を覚えたまま使い続けられる仕組みです。`bind1` が返す関数は、`p` を覚えています。
- **可変長引数 `...`**: 残りの引数すべてを表します。`fn(p, ...)` と書くと、`p` の後ろに、残りの引数がそのまま並びます。
- **`utils.function_arg`**: 渡された値が関数（または関数として使える文字列）かを確かめ、そうでなければエラーにする Penlight の関数です。

## 何をしているか

### 1. 渡されたものが関数かを確かめる

`utils.function_arg(1, fn)` で、`fn` が呼べるものかを確かめます。Penlight では、`"+"` のような演算子の文字列も関数として受け付けるので、その変換もここで行います。

```lua:line-numbers=828
    fn = utils.function_arg(1,fn)
```

### 2. 固定した値を先頭に足して呼ぶ

返す関数は、`...` で受け取った残りの引数の前に、固定した `p` を置いて `fn` を呼びます。呼び出し側は、`p` のことを知らなくて済みます。

```lua:line-numbers=829
    return function(...) return fn(p,...) end
```

使い方は次の通りです。

```lua
local function greet(a, b, c)
    print(a .. " " .. b .. " " .. c)
end

local hello = utils.bind1(greet, "world")
hello("Hello", "!")   -- "world" が a に入る: "world Hello !"
```

## ここがすごい

- **呼び出し側を簡単にする**: 毎回同じ値を渡す代わりに、1 回だけ包んでおけます。コールバックのような、引数の数が決まった形で渡す場面で役立ちます。
- **可変長引数で何個でも通す**: `...` で残りをそのまま渡すので、`bind1` 自体は引数の数を知らなくても正しく動きます。
- **部分適用の基本形**: 1 つの小さな関数で、部分適用の考え方が実装できています。より複雑な組み合わせも、この形を積み重ねて作れます。
- **注意点**: `p` は、包まれた関数が呼ばれるたびに同じ値として使われます。ループの中で変わる値を固定したいときは、その時点の値を `bind1` に渡す必要があります。

## まとめ

- 関数の最初の引数を固定したいときは、`...` を使った包みの関数を返すと簡単に作れる。
- 固定する値は、包むときに決まって、その後は変わらない。
- 部分適用は、コールバックの準備や、同じ処理の使い回しに役立つ。
