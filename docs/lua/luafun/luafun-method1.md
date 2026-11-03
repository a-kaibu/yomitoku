---
title: 関数を、列のメソッドに変える method1 の仕組み
description: LuaJIT 向け関数型ライブラリ Lua Fun の method1。引数を一つ取る関数を、列の表から呼べるメソッドの形に変えます。列の三つ組を、自動で関数に渡します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [152, 156]
format: 2
function: method1
difficulty: 2
tags: [設計パターン, クロージャ, 関数型]
---
## ひとことで

`method1(fun)` は、引数を一つ取る関数 `fun` を、列の表から呼べるメソッドの形に変える関数です。メソッドとして呼ぶと、列の `gen`、`param`、`state` は自動で補われます。利用者は、`it:take_n(3)` のように、列の表に対して直接書けます。

## コード

```lua:line-numbers=152
local method1 = function(fun)
    return function(self, arg1)
        return fun(arg1, self.gen, self.param, self.state)
    end
end
```

## 前提知識

- **メソッドの呼び出し `obj:f(x)`**: `obj` を第一引数 `self` として渡す書き方です。Lua の表の関数を、オブジェクトのように呼べます。
- **クロージャ**: 関数の中で作られた関数が、外側の `fun` を覚えたまま使い続けられる仕組みです。ここでは、包んだ関数が `fun` を覚えています。
- **`self.gen`、`self.param`、`self.state`**: 列の表が持つ三つ組です。`wrap` によって、この鍵に値が入っています。
- **引数の並び**: 元の関数は、最初に引数 `arg1`、その後に三つ組を受け取ります。この並びに合わせて、メソッドから呼び直します。

## 何をしているか

### 1. 包んだメソッドを返す

`method1(fun)` は、`function(self, arg1)` の形の関数を返します。これが、列の表から呼ばれるメソッドになります。

```lua:line-numbers=153
    return function(self, arg1)
```

### 2. 列の三つ組を補って、元の関数を呼ぶ

メソッドの中で、`fun(arg1, self.gen, self.param, self.state)` を呼びます。利用者が渡した `arg1` と、列の三つ組を並べて、元の関数に渡します。

```lua:line-numbers=154
        return fun(arg1, self.gen, self.param, self.state)
```

## ここがすごい

- **書き方が自然になる**: 関数として `take_n(3, it)` と書く代わりに、`it:take_n(3)` と書けます。連鎖もしやすくなります。
- **同じ関数を二通りに**: 関数の形とメソッドの形の両方が、同じ中身で使えます。仕組みを一か所に集めています。
- **三つ組を書かなくてよい**: 利用者は、列の中身を意識せずに、引数だけを渡せます。
- **注意点**: メソッドとして呼ぶには、`self` が列の表である必要があります。普通の値に対して `:` で呼ぶと、エラーになります。

## まとめ

- 関数をメソッドに変えると、列の操作を、オブジェクトの書き方で連ねられる。
- 同じ中身を、関数とメソッドの両方で使えるように包むと、重複を避けられる。
- 呼ぶ側が意識しなくてよい情報は、包む仕組みの中に隠すと、使いやすくなる。
