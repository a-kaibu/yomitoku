---
title: 三つ組を、一つの表にまとめる wrap
description: LuaJIT 向け関数型ライブラリ Lua Fun の wrap。イテレータの関数、材料、状態の三つを、一つの表にまとめます。その表には、列の操作をする metatable が付きます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [70, 76]
format: 2
function: wrap
difficulty: 2
tags: [設計パターン, メタプログラミング, イテレータ]
---
## ひとことで

`wrap(gen, param, state)` は、イテレータの三つ組 `gen`、`param`、`state` を、一つの表にまとめる関数です。表には、列を操作するための metatable が付きます。そのため、利用者は、`it:map(...)` のようにメソッドの形で列を扱えます。値としての列を、オブジェクトのように扱えるようにする仕組みです。

## コード

```lua:line-numbers=70
local wrap = function(gen, param, state)
    return setmetatable({
        gen = gen,
        param = param,
        state = state
    }, iterator_mt), param, state
end
```

## 前提知識

- **三つ組の列**: Lua Fun の列は、`gen`、`param`、`state` の三つで表されます。`gen` が次を作り、`param` が材料、`state` が今の位置です。
- **`setmetatable`**: 表に metatable を付ける標準関数です。metatable を通して、メソッドの呼び出しなどの振る舞いを決められます。
- **`iterator_mt`**: 列の表に共通して付く metatable です。そこに、`map` や `filter` などの操作がまとめられています。
- **複数の戻り値**: `wrap` は、表を返すと同時に、`param` と `state` も返します。`for` で直接回せるように、三つ組の形も一緒に返しています。

## 何をしているか

### 1. 三つの値を、名前つきの表にまとめる

`gen`、`param`、`state` を、それぞれ同じ名前の鍵で表に入れます。これで、後から一つずつ取り出せます。

```lua:line-numbers=71
    return setmetatable({
        gen = gen,
        param = param,
        state = state
```

### 2. metatable を付けて、三つ組も返す

表に `iterator_mt` を付けて返します。加えて、`param` と `state` を、そのまま後ろの戻り値として返します。`for ... in` の形で回せるようにするためです。

```lua:line-numbers=75
    }, iterator_mt), param, state
```

## ここがすごい

- **メソッドで操作できる**: 列の表に metatable があるので、`map` や `filter` などを、メソッドとして呼べます。読みやすい連鎖の書き方ができます。
- **`for` でもそのまま使える**: 三つ組を同時に返すので、表を作らずに、普通の `for` でも回せます。どちらの書き方もできます。
- **中身が見える**: 列の情報が、表の鍵として見えています。`unwrap` で、いつでも三つ組に戻せます。
- **注意点**: 表は、作るたびに新しく生まれるので、大量の列を作ると、その分の表が増えます。短い連鎖なら問題ありませんが、ループの中で大量に作るのは避けてください。

## まとめ

- 三つ組の列をオブジェクトのように扱うには、表にまとめて metatable を付けると、メソッドの形で書ける。
- 同じ値を複数の形で返すと、呼ぶ側が使いたい書き方を選べる。
- 小さな表でも、大量に作ると負担になるので、作る数を意識する。
