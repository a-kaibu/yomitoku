---
title: 終わったら最初から回り直す、cycle の状態の保存
description: LuaJIT 向け関数型ライブラリ Lua Fun の cycle。イテレータが尽きると、最初の状態を深いコピーして回り直します。コピーをするので、途中の書き換えが元の状態を壊しません。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [950, 961]
format: 2
function: cycle_gen_call
difficulty: 3
tags: [遅延評価, イテレータ, 防御的プログラミング]
---

## ひとことで

`cycle` は、イテレータの値を尽きるまで出したら、また最初から出し直す、無限に続くイテレータを作る関数です。尽きたときに、最初の状態を使って回り直します。そのため、最初の状態をコピーして保存しておく仕組みが必要です。

## コード

```lua:line-numbers=950
local cycle_gen_call = function(param, state_x, ...)
    if state_x == nil then
        local gen_x, param_x, state_x0 = param[1], param[2], param[3]
        return gen_x(param_x, deepcopy(state_x0))
    end
    return state_x, ...
end

local cycle_gen = function(param, state_x)
    local gen_x, param_x = param[1], param[2]
    return cycle_gen_call(param, gen_x(param_x, state_x))
end
```

## 前提知識

- **状態のコピー**: テーブルの状態を `b = a` と代入すると、中身は共有されます。`deepcopy` は、入れ子も含めて新しく作ります。
- **無限列**: 終わりがない値の列です。`cycle` は、有限の列を無限に繰り返せます。
- **`nil` の合図**: イテレータが尽きたときに返す合図です。`cycle` はこの合図を見て、回り直します。

## 何をしているか

### 1. 尽きたら最初の状態をコピーして回り直す

`state_x` が `nil` なら、保存しておいた最初の状態 `state_x0` を深くコピーして、もう一度 `gen_x` を呼びます。

```lua:line-numbers=953
        return gen_x(param_x, deepcopy(state_x0))
```

### 2. 尽きていなければそのまま返す

まだ値があれば、状態と値をそのまま返します。

```lua:line-numbers=955
    return state_x, ...
```

### 3. 毎回の呼び出しで判定する

`cycle_gen` は、元のイテレータを 1 回動かし、その結果を `cycle_gen_call` に渡します。判定は、その 1 回ごとに行われます。


補足として、`cycle` は「元のイテレータを包む」ので、使う側は終わりを気にせずに値を取り続けられます。ただし、`take` や `take_while` と組み合わせて必要な分だけ取ることが前提の使い方です。全部を `totable` で集めると、無限に続いてメモリが尽きてしまいます。

## ここがすごい

- **状態を守るための深いコピー**: 最初の状態をそのまま再利用すると、途中で書き換えられた表が次の周回にも残ってしまいます。コピーすることで、毎周回の初期状態がそろいます。
- **判定を 1 か所に**: 尽きたかどうかは `cycle_gen_call` だけが判定します。ほかの部分は、元のイテレータの動きに従うだけです。
- **注意点**: 元の列が空だと、尽きてもすぐに尽きる状態になり、無限に回り続けてしまう場合があります。空の列には使わないでください。

## まとめ

- 無限に繰り返すには、尽きたら最初の状態から回り直す形にする。
- 状態はテーブルを含むことがあるので、回り直す前に深くコピーしておく。
- 空の列を無限に繰り返すと、終わらない。使う前に空でないことを確かめる。
