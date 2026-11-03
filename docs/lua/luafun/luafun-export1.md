---
title: 列を引数で受ける export1 の変換
description: LuaJIT 向け関数型ライブラリ Lua Fun の export1。引数を一つ取る関数を、三つ組をそのまま受け取る公開の関数に変えます。受け取った三つ組は、必要に応じて列に変換されます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [170, 174]
format: 2
function: export1
difficulty: 2
tags: [設計パターン, クロージャ, イテレータ]
---
## ひとことで

`export1(fun)` は、引数を一つ取る関数 `fun` を、公開の関数の形に変える関数です。公開の関数は、引数のあとに、列の三つ組を `gen`、`param`、`state` の形で受け取ります。受け取った三つ組は、`rawiter` で正しい列の形に直してから、`fun` に渡されます。

## コード

```lua:line-numbers=170
local export1 = function(fun)
    return function(arg1, gen, param, state)
        return fun(arg1, rawiter(gen, param, state))
    end
end
```

## 前提知識

- **公開の関数と内部の関数**: 利用者が呼ぶ関数（公開）と、その中で使う関数（内部）を分ける考え方です。`export1` は、両者をつなぐ橋渡しをします。
- **`rawiter`**: どんな値でも、回せる三つ組に変える Lua Fun の入口です。表、関数、文字列を、それぞれ適切な形にします。
- **可変でない引数の並び**: 公開の関数は、最初に引数 `arg1`、そのあとに三つ組を受け取ります。この並びは、`method1` のメソッドとは少し違います。
- **同じ `fun` を別の形で**: 同じ処理を、メソッドにも、公開の関数にも使えるようにするための変換です。

## 何をしているか

### 1. 公開の関数の形を作る

`export1(fun)` は、`function(arg1, gen, param, state)` の形の関数を返します。利用者は、この形で呼びます。

```lua:line-numbers=171
    return function(arg1, gen, param, state)
```

### 2. 三つ組を列の形に直して、元の関数を呼ぶ

`rawiter(gen, param, state)` で、受け取った値を回せる三つ組にします。その結果を、`arg1` と一緒に `fun` へ渡します。

```lua:line-numbers=172
        return fun(arg1, rawiter(gen, param, state))
```

## ここがすごい

- **どんな入力でも受け止める**: 表、関数、文字列などを渡しても、`rawiter` が正しい形に直します。利用者は、型を気にせずに使えます。
- **中身の処理は一つ**: 公開の関数もメソッドも、同じ `fun` を呼びます。処理の規則を、一か所にまとめられます。
- **変換が見える**: 二行だけで、変換の仕組みが全部わかります。読んで、すぐ理解できます。
- **注意点**: `rawiter` は、対応しない値にエラーを起こします。渡す値の種類は、事前に確かめてください。

## まとめ

- 公開の関数は、受け取る値を形にそろえてから処理すると、利用者が種類を気にせずに済む。
- 同じ処理を複数の形で公開するときは、変換の関数で包むと、中身を一か所に保てる。
- 入力の変換の仕組みは、短くても、役割を理解しておくと後で直しやすい。
