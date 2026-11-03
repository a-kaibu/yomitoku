---
title: 値が最初に現れる位置を、回しながら数える index
description: LuaJIT 向け関数型ライブラリ Lua Fun の index。イテレータの値を先頭から比べ、最初に一致した位置を返します。見つからなければ nil を返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [489, 498]
format: 2
function: index
difficulty: 1
tags: [イテレータ, 探索, 遅延評価]
---

## ひとことで

`index(x, gen, param, state)` は、イテレータの値の中から、値 `x` が最初に現れる位置（何番目か）を返す関数です。`fun.index(20, fun.range(10, 30, 5))` のように使います。値が見つからなければ `nil` を返します。配列の添字を探す `indexOf` のような操作を、どんなイテレータでも行えるようにしたものです。

## コード

```lua:line-numbers=489
local index = function(x, gen, param, state)
    local i = 1
    for _k, r in gen, param, state do
        if r == x then
            return i
        end
        i = i + 1
    end
    return nil
end
```

## 前提知識

- **`for` の 3 つ組**: `for 変数 in gen, param, state do` の形で、イテレータを回す Lua の文法です。`index` は、この形で `gen` を回しています。
- **位置の数え方**: Lua の番号は 1 から数えます。`i` を 1 から始め、1 回ごとに 1 増やすことで、何番目かを記録しています。
- **`_k`**: 使わない変数に付ける慣習的な名前です。`for` の最初の戻り値（キー）は、ここでは必要ありません。
- **`nil`**: 値がないことを表します。見つからなかったことを、この値で知らせます。

## 何をしているか

### 1. 位置を 1 から数えながら回す

`i` は 1 から始まり、値を 1 つ見るたびに 1 増えます。`for _k, r in gen, param, state` で、イテレータの値を 1 つずつ `r` に取り出します。

```lua:line-numbers=490
    local i = 1
    for _k, r in gen, param, state do
```

### 2. 一致したら、そのときの位置を返す

`r == x` なら、今の `i` を返して終わります。途中で見つかった時点でループを抜けるので、残りの値は作られません。

```lua:line-numbers=492
        if r == x then
            return i
        end
```

### 3. 最後まで見つからなければ nil

ループが最後まで行っても一致がなければ、`nil` を返します。

```lua:line-numbers=497
    return nil
```

## ここがすごい

- **見つかった時点で止まる**: 最初の一致で `return` するので、残りの値を無駄に作りません。長い列や無限の列でも、一致があれば必ず終わります。
- **配列に限らない**: 配列の添字を調べる関数は、配列にしか使えないことが多いです。この関数はイテレータなら何でも扱えるので、文字列の 1 文字ずつや、範囲の数にも同じように使えます。
- **素直で短い**: 数える、比べる、返す、の 3 つだけで書かれています。ループの形を覚えれば、ほかの探索関数も同じように書けます。
- **注意点**: 比べるのは `==` なので、テーブルの中身を比べるわけではありません。テーブル同士を探すときは、同じ参照かどうかで判定される点に注意が要ります。

## まとめ

- 値の位置を探すには、位置を数えながら回して、一致した時点で返すと簡単に書ける。
- 見つかったら途中で止めると、無限の列でも安全に使える。
- 配列専用ではなく、イテレータの形で書くと、より多くの場面で使える。
