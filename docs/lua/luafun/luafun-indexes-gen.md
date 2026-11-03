---
title: 同じ値の位置を、順に数えて返す indexes_gen
description: LuaJIT 向け関数型ライブラリ Lua Fun の indexes_gen。列の中で指定した値が現れるたびに、その位置の番号を返すイテレータの関数です。番号は 1 から数えます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [506, 520]
format: 2
function: indexes_gen
difficulty: 3
tags: [探索, 遅延評価, イテレータ]
---
## ひとことで

`indexes_gen(param, state)` は、列の中で指定した値 `x` が現れるたびに、その位置の番号を返すイテレータの関数です。番号は `1` から数えます。見つからない値は飛ばされ、列の終わりでは `nil` を返して止まります。

## コード

```lua:line-numbers=506
local indexes_gen = function(param, state)
    local x, gen_x, param_x = param[1], param[2], param[3]
    local i, state_x = state[1], state[2]
    local r
    while true do
        state_x, r = gen_x(param_x, state_x)
        if state_x == nil then
            return nil
        end
        i = i + 1
        if r == x then
            return {i, state_x}, i
        end
    end
end
```

## 前提知識

- **材料と状態**: 材料 `param` には、探す値 `x`、元の列の三つ組が入っています。状態 `state` には、現在までに数えた番号 `i` と、元の列の状態が入っています。
- **`while true` と `return`**: 無限に繰り返しながら、条件が合ったときに `return` で抜ける書き方です。一つ見つけるたびに、列の次の値を返せる形になります。
- **番号の進め方**: 元の列の値を一つ読むたびに、番号 `i` を一つ増やします。値が一致したかどうかに関係なく、読んだ数を数えています。
- **`r == x`**: 読んだ値が、探す値と同じかを比べます。同じなら、その位置の番号を返します。

## 何をしているか

### 1. 元の列から次の値を読み、番号を進める

`gen_x` で元の列の次の状態と値を取り出します。列が終わっていれば、`nil` を返して止まります。終わっていなければ、番号 `i` を一つ増やします。

```lua:line-numbers=510
    while true do
        state_x, r = gen_x(param_x, state_x)
        if state_x == nil then
            return nil
        end
        i = i + 1
```

### 2. 値が一致したら、番号を返す

読んだ値が `x` と同じなら、新しい状態と番号 `i` を返します。ここで列の一つ分の値が決まります。

```lua:line-numbers=516
        if r == x then
            return {i, state_x}, i
        end
```

## ここがすごい

- **位置だけを返す**: 値そのものではなく、どこにあるかの番号を返します。後で、その位置の値を確かめる処理にも使えます。
- **一致するものだけ返す**: 一致しない値は、返さずに読み進めます。必要な位置だけが、列として見えます。
- **番号を状態に持つ**: 今までに数えた数が、状態の中にあるので、途中から再開しても番号がずれません。
- **注意点**: 探す値は、`==` で比べられます。表のような値は、中身ではなく同じ実体かどうかで比べられるので、注意してください。

## まとめ

- 特定の値の位置を集めるには、番号を状態に持って、一致した時点で番号を返す形にする。
- 番号を状態に入れておくと、途中で止めても、続きから正しく数え直せる。
- 比べる方法が `==` であることを、使う前に確かめておく。
