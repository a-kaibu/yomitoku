---
title: 値を 1 つずつ畳み込み、結果を次へ渡す foldl
description: LuaJIT 向け関数型ライブラリ Lua Fun の foldl。イテレータの値を左から順に、途中までの結果と一緒に関数へ渡して 1 つの値にまとめます。reduce という別名もあります。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [615, 623]
format: 2
function: foldl
difficulty: 2
tags: [関数型, イテレータ, 遅延評価]
---

## ひとことで

`foldl(fun, start, gen, param, state)` は、イテレータの値を先頭から 1 つずつ取り出し、「今までの結果」と「次の値」を関数 `fun` に渡して、新しい結果を作る関数です。合計や最大値、リストの連結など、多くの処理がこの形で書けます。`reduce` という別名でも呼べます。

## コード

```lua:line-numbers=615
local foldl = function(fun, start, gen_x, param_x, state_x)
    while true do
        state_x, start = foldl_call(fun, start, gen_x(param_x, state_x))
        if state_x == nil then
            break;
        end
    end
    return start
end
```

1 回分の処理を行う `foldl_call` も、読むのに必要なので引用します。

```lua:line-numbers=608
local foldl_call = function(fun, start, state, ...)
    if state == nil then
        return nil, start
    end
    return state, fun(start, ...)
end
```

## 前提知識

- **畳み込み（fold）**: 値の列を 1 つにまとめる操作です。`{1, 2, 3}` を足し算で畳み込むと、`((0+1)+2)+3` で `6` になります。
- **イテレータの 3 つ組**: `gen`（次を作る関数）、`param`（材料）、`state`（今の位置）の組です。`foldl` は、この 3 つを順に呼びます。
- **可変長引数 `...`**: `foldl_call` は、`gen` が返す値を、そのまま `fun` に渡すために `...` を使っています。
- **`break`**: ループを途中で抜けるための文です。

## 何をしているか

### 1. 次の値を取り出す

`foldl_call(fun, start, gen_x(param_x, state_x))` は、`gen_x` を 1 回呼んで次の `state` と値を得ます。値があれば、`fun(start, 値)` で結果を更新します。

```lua:line-numbers=617
        state_x, start = foldl_call(fun, start, gen_x(param_x, state_x))
```

### 2. 値が尽きたら終わり

`foldl_call` は、イテレータが終わると `nil` と、今までの結果 `start` を返します。`state_x` が `nil` になったら、ループを抜けて `start` を返します。

```lua:line-numbers=618
        if state_x == nil then
            break;
        end
```

### 3. 結果を次の回へ渡す

`fun(start, ...)` の戻り値が、次の回の `start` になります。つまり、結果が 1 回ごとに更新され、最後の値が残ります。

## ここがすごい

- **結果を引き回すだけの仕組み**: 途中の結果を変数に持ち歩き、関数が返すたびに更新するだけです。合計も、最大値も、同じ仕組みで書けます。
- **終わりを `nil` で知らせる**: `foldl_call` が「終わり」の印を `nil` で返すので、`foldl` 自体はループの条件を数えたり比べたりしなくて済みます。
- **値を配列にしない**: 途中の結果だけを持つので、全部を配列に集めてから計算する方法より、メモリが少なくて済みます。
- **注意点**: 初期値 `start` は、`fun` が使える形で与える必要があります。合計なら `0`、連結なら空のリストなど、処理に合わせて決めます。

## まとめ

- 値の列を 1 つにまとめるには、途中の結果と次の値を関数に渡す形が汎用的。
- イテレータの終わりを `nil` で知らせると、ループの条件を単純にできる。
- 全部を集めずに途中の結果だけを持つと、メモリを節約できる。
