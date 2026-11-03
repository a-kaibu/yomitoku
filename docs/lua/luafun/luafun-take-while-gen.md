---
title: 条件が真の間だけ値を通す take_while の内部
description: LuaJIT 向け関数型ライブラリ Lua Fun の take_while の内部。条件が真の間は値を返し、偽になった時点で列を終える二つの関数です。遅延して一つずつ判定します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [383, 393]
format: 2
function: take_while_gen
difficulty: 3
tags: [遅延評価, イテレータ, 関数型]
---
## ひとことで

`take_while_gen` と `take_while_gen_x` は、`take_while` が作った列を、一つずつ進めるための内部の関数です。元の列から値を取り出し、条件 `fun` が真なら値を返し、偽になった時点で列を終わらせます。判定は、値が必要になったときだけ行われます。

## コード

```lua:line-numbers=383
local take_while_gen_x = function(fun, state_x, ...)
    if state_x == nil or not fun(...) then
        return nil
    end
    return state_x, ...
end

local take_while_gen = function(param, state_x)
    local fun, gen_x, param_x = param[1], param[2], param[3]
    return take_while_gen_x(fun, gen_x(param_x, state_x))
end
```

## 前提知識

- **材料 `{fun, gen, param}`**: 条件と、元の列の三つ組をまとめた材料です。`take_while` が作り、この関数が毎回受け取ります。
- **`take_while_gen_x` の役割**: 元の列から取り出した状態と値を受け取り、条件で判定する関数です。判定の結果によって、値を返すか、列を終えるかを決めます。
- **可変長の値**: 元の列が複数の値を返しても、条件に渡して、その値を後ろへそのまま返します。
- **`not fun(...)`**: 条件が偽のときに、真になる式です。偽の値が出た時点で、列を止めるために使います。

## 何をしているか

### 1. 材料から条件と元の列を取り出す

`take_while_gen` は、材料の中から、条件 `fun`、元の列 `gen_x`、`param_x` を取り出します。そして、元の列を一つ進めた結果を、判定の関数に渡します。

```lua:line-numbers=391
    local fun, gen_x, param_x = param[1], param[2], param[3]
    return take_while_gen_x(fun, gen_x(param_x, state_x))
```

### 2. 条件で判定し、通すか止めるかを決める

`take_while_gen_x` は、状態が `nil` か、条件が偽なら、`nil` を返して列を終えます。そうでなければ、新しい状態と値を返して、列を続けます。

```lua:line-numbers=384
    if state_x == nil or not fun(...) then
        return nil
    end
    return state_x, ...
```

## ここがすごい

- **判定は値が必要なときだけ**: 条件の判定は、列が回されるたびに一つずつ行われます。先の値を、余計に調べることはありません。
- **複数の値も扱える**: 可変長の引数で受けるので、列が複数の値を返しても、その形を崩さずに渡せます。
- **止まるのが早い**: 条件が偽になった時点で列を終えるので、残りの値は一切計算されません。無限の列にも使えます。
- **注意点**: 条件の判定が途中で偽になると、その後にどんな値があっても取り出されません。条件の境界を、事前に確かめておいてください。

## まとめ

- 列を途中で止める処理は、値が必要なときだけ判定すると、無駄な計算を省ける。
- 判定の結果で列を終える仕組みは、無限の列でも安全に使える。
- 複数の値を返す列は、可変長の引数で受けると、形を崩さずに扱える。
