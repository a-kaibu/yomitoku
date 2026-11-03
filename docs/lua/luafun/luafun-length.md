---
title: 数えずに長さがわかる場合は、計算だけで答えを出す
description: LuaJIT 向け関数型ライブラリ Lua Fun の length。配列のイテレータなら残りの数を引き算で求め、それ以外は最後まで回して数えます。速さと正しさを両立させる分岐です。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [629, 639]
format: 2
function: length
difficulty: 2
tags: [イテレータ, 最適化, 関数型]
---

## ひとことで

`length(gen, param, state)` は、イテレータが何個の値を返すかを数える関数です。`fun.length(fun.range(10))` のように使います。イテレータの種類によっては、回らなくても答えがわかります。配列を回すイテレータなら、残りの個数を引き算で出せるので、その場合は一度も回しません。

## コード

```lua:line-numbers=629
local length = function(gen, param, state)
    if gen == ipairs_gen or gen == string_gen then
        return #param - state
    end
    local len = 0
    repeat
        state = gen(param, state)
        len = len + 1
    until state == nil
    return len - 1
end
```

## 前提知識

- **イテレータの 3 つ組**: Lua Fun では、イテレータは「次を作る関数（`gen`）」「動かない材料（`param`）」「今の位置（`state`）」の 3 つで表されます。`length` もこの 3 つを受け取ります。
- **`ipairs_gen` と `string_gen`**: 配列や文字列を順に返すための、ライブラリ内の専用の関数です。`gen` がこれらと同じなら、中身が配列だとわかります。
- **`repeat ... until`**: 条件が真になるまで、必ず 1 回は実行を繰り返す Lua の文法です。`while` と違い、最初に条件を確かめません。
- **`#param`**: 配列の長さです。

## 何をしているか

### 1. 配列を回すイテレータなら引き算で答える

`gen` が配列用（`ipairs_gen`）または文字列用（`string_gen`）のとき、`#param - state` で残りの個数を出します。`state` は今の位置なので、全体の長さから今までに進んだ分を引けば、残りが求まります。

```lua:line-numbers=630
    if gen == ipairs_gen or gen == string_gen then
        return #param - state
    end
```

### 2. それ以外は最後まで回して数える

どちらでもない場合は、`repeat` で `gen` を呼び続け、`nil` が返るまで数えます。`len` は終わりの `nil` も 1 回と数えてしまうので、最後に `len - 1` を返します。

```lua:line-numbers=633
    local len = 0
    repeat
        state = gen(param, state)
        len = len + 1
    until state == nil
    return len - 1
```

## ここがすごい

- **種類ごとに最短の道を選ぶ**: 配列なら 1 回も回らずに答えを出し、それ以外は仕方なく数えます。同じ関数の中で、データの形に合わせた最適化ができています。
- **終わりの 1 回を引く書き方**: `until state == nil` は、値が尽きたことを確かめる回を含むので、数の合計から 1 を引いて補正しています。数え上げでよく起きる 1 つずれを、きちんと処理しています。
- **速さの差が大きい**: 配列の長さが 100 万なら、数え上げは 100 万回の呼び出しになります。引き算なら 1 回の計算です。
- **注意点**: 引き算が正しいのは、`state` が「1 から数えた今の位置」の形のときだけです。`ipairs_gen` 以外の生成器を同じ扱いにすると、答えが合わなくなります。

## まとめ

- 数える処理は、データの形がわかるなら計算で答えを出せる。
- 繰り返しで数えるときは、最後の終わりの回を補正し忘れないようにする。
- 特別な場合を先に判定すると、一般的な処理を書いたまま速さも得られる。
