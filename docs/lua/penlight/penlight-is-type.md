---
title: 型の名前か metatable か、渡され方で比べ方を変える is_type
description: Lua のユーティリティ集 Penlight の utils.is_type。第 2 引数が文字列なら type() の結果と比べ、それ以外ならクラスの metatable と比べます。1 つの関数で 2 つの判定を使い分けています。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [177, 181]
format: 2
function: utils.is_type
difficulty: 1
tags: [型システム, イディオム, 設計パターン]
---

## ひとことで

`utils.is_type(obj, tp)` は、値 `obj` が `tp` という型かを調べる関数です。`tp` が `"string"` のような文字列なら、Lua の基本的な型（`type` の結果）と比べます。`tp` がテーブル（クラスの metatable）なら、`obj` の metatable と比べます。1 つの関数で、基本の型とクラスの両方を判定できます。

## コード

```lua:line-numbers=177
function utils.is_type (obj,tp)
    if type(tp) == 'string' then return type(obj) == tp end
    local mt = getmetatable(obj)
    return tp == mt
end
```

## 前提知識

- **`type(x)`**: 値の基本の型を文字列で返します。`"number"`、`"string"`、`"table"`、`"function"` などです。
- **metatable**: テーブルの振る舞いを決める裏のテーブルです。Penlight のクラスでは、インスタンスの metatable がクラスの役目をします。
- **`getmetatable(x)`**: 値の metatable を返します。metatable がなければ `nil` です。
- **`==`**: テーブル同士の比較は、中身ではなく同じ実体かどうかで判定されます。

## 何をしているか

### 1. 文字列が渡されたら基本の型で比べる

`tp` が文字列なら、`type(obj)` と比べるだけで答えが出ます。`utils.is_type("hello", "string")` は `true` です。

```lua:line-numbers=178
    if type(tp) == 'string' then return type(obj) == tp end
```

### 2. それ以外はクラスの metatable で比べる

文字列でなければ、`tp` はクラスのテーブルだと考えます。`getmetatable(obj)` を取り出して、`tp` と同じ実体かを比べます。`obj` にメタテーブルがなければ `nil` と比べることになり、`false` です。

```lua:line-numbers=179
    local mt = getmetatable(obj)
    return tp == mt
```

この比べ方は、直接の型しか見ません。親クラスから作られたかは判定しないので、継承まで調べたいときは別の関数が必要です。

## ここがすごい

- **引数の種類で使い分ける**: 文字列とテーブルという、違う種類の指定を同じ引数で受け取ります。呼び出し側は、「型の名前」か「クラス」かを渡すだけでよく、関数の名前を変える必要がありません。
- **判定が 2 行で済む**: 基本の型も、クラスも、同じ `if` の形で書けます。短いので、読んで直ちに理解できます。
- **メタテーブルで型を表す慣習**: Lua には `instanceof` のような演算子がありません。クラスの metatable を型として比べる約束にすれば、どんな値でも型を確かめられます。
- **注意点**: 直接の metatable しか見ないので、継承したクラスのインスタンスは `false` になります。親子の判定が必要なら、親をたどる処理を別に書く必要があります。

## まとめ

- 型の指定が文字列かテーブルかで比べ方を分けると、1 つの関数で基本の型とクラスの両方を扱える。
- 言語に演算子がない型判定は、metatable を型の印として使うと実現できる。
- 直接の型だけを比べる判定は、継承を見ない。必要なら別に親をたどる処理を用意する。
