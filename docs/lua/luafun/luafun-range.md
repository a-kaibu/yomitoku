---
title: 数えるための「状態」だけを持つ、遅延評価の範囲生成
description: LuaJIT 向け関数型ライブラリ Lua Fun の range。1 から N までの数を全部作らず、「次の数を作る関数」と「今の状態」を組にして返すことで、大きな範囲でもメモリを使いません。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [216, 238]
format: 2
function: range
difficulty: 3
tags: [遅延評価, イテレータ, 関数型]
---

## ひとことで

`range(start, stop, step)` は、`start` から `stop` まで `step` ずつ増える数を、順番に 1 つずつ作るための「イテレータ」を返す関数です。`range(1, 1000000)` と書いても、100 万個の数を配列に並べるわけではありません。次の数が必要になったときに、その 1 つだけを計算します。

## コード

```lua:line-numbers=216
local range = function(start, stop, step)
    if step == nil then
        if stop == nil then
            if start == 0 then
                return nil_gen, nil, nil
            end
            stop = start
            start = stop > 0 and 1 or -1
        end
        step = start <= stop and 1 or -1
    end

    assert(type(start) == "number", "start must be a number")
    assert(type(stop) == "number", "stop must be a number")
    assert(type(step) == "number", "step must be a number")
    assert(step ~= 0, "step must not be zero")

    if (step > 0) then
        return wrap(range_gen, {stop, step}, start - step)
    elseif (step < 0) then
        return wrap(range_rev_gen, {stop, step}, start - step)
    end
end
```

次の数を作る関数 `range_gen` も、読むのに必要なので引用します。

```lua:line-numbers=198
local range_gen = function(param, state)
    local stop, step = param[1], param[2]
    local state = state + step
    if state > stop then
        return nil
    end
    return state, state
end
```

## 前提知識

- **イテレータ**: `for` 文で値を 1 つずつ取り出すための関数です。呼ぶたびに次の値を返し、終わりになると `nil` を返します。
- **遅延評価（lazy）**: 値が本当に必要になるまで計算を後回しにすることです。全部を先に作らないので、大きな範囲でも使えます。
- **引数の省略**: `range(5)` は `1` から `5` まで、`range(3, 1)` は `3` から `1` へ逆向きに数えます。`step` を省略すると、`start` と `stop` の大小から自動で決まります。
- **`assert`**: 条件が偽のときにエラーを出す関数です。引数の型や `step` が `0` でないことを、最初に確かめるために使われています。

## 何をしているか

### 1. 省略された引数を補う

`step` が省略されたときは、`start <= stop` なら `1`、そうでなければ `-1` にします。`stop` まで省略されると、`range(5)` のように `start` を終わりとして、`1` から数えるように決めます。

```lua:line-numbers=217
    if step == nil then
        if stop == nil then
            if start == 0 then
                return nil_gen, nil, nil
            end
            stop = start
            start = stop > 0 and 1 or -1
        end
        step = start <= stop and 1 or -1
    end
```

### 2. 引数の型と向きを確かめる

数字でない引数や、`step` が `0` の場合は、`assert` で止めます。`step` が `0` だと、数が永遠に増えないイテレータができてしまうからです。

```lua:line-numbers=228
    assert(type(start) == "number", "start must be a number")
```

```lua:line-numbers=231
    assert(step ~= 0, "step must not be zero")
```

### 3. 状態と次の数を作る関数を組にする

`wrap(range_gen, {stop, step}, start - step)` は、3 つの要素を持つイテレータを作ります。`{stop, step}` は動かない条件（終わりの数と増分）、`start - step` は今の状態です。最初の呼び出しで `start - step + step` となり、`start` が最初に返されます。

```lua:line-numbers=233
    if (step > 0) then
        return wrap(range_gen, {stop, step}, start - step)
```

`range_gen` は、今の状態に `step` を足し、`stop` を超えたら `nil` を返して終わります。配列は使わず、数字を 1 つずつ作ります。

## ここがすごい

- **メモリを使わない**: 範囲の長さに関係なく、覚えておくのは終わりと増分、今の状態だけです。`range(1, 10^9)` と書いても、ほとんど何も使いません。
- **初期値を `start - step` にする工夫**: 最初の呼び出しで `step` を足すと `start` になります。特別な「最初の場合」の分岐がいらないので、`range_gen` は 1 つの書き方で済みます。
- **向きごとに関数を分ける**: 増える方向と減る方向で、比べる向きが違います。`range_gen` と `range_rev_gen` に分けることで、それぞれの中の条件が単純になります。
- **素直な書き方との比較**: `for i = start, stop, step` を使えば済む場面もあります。ただし、このライブラリは `map` や `filter` と組み合わせるので、値を 1 つずつ渡せるイテレータの形が必要になります。
- **注意点**: `step` が小数だと、誤差で終わりの値が含まれたり含まれなかったりします。整数の範囲に使うのが安全です。

## まとめ

- 大きな範囲は、配列ではなく「状態と次を作る関数」の組で表すと、メモリを使わずに済む。
- 初期状態を 1 つ前の値にしておくと、最初の呼び出しの特別扱いが要らなくなる。
- 引数の向きや型は、イテレータを作る前に `assert` で確かめる。
