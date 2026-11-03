---
title: 大きい方から小さい方へ数える range_rev の生成器
description: LuaJIT 向け関数型ライブラリ Lua Fun の range_rev_gen。範囲の数を、逆向きに一つずつ生成するイテレータの関数です。状態を増やす方向と、終わりの判定が、通常の range と逆になります。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [207, 214]
format: 2
function: range_rev_gen
difficulty: 2
tags: [遅延評価, イテレータ, 数値計算]
---
## ひとことで

`range_rev_gen(param, state)` は、逆向きの範囲の数を一つずつ作るイテレータの関数です。状態は、今の数を表します。毎回、刻みの分だけ数を減らし、下限を下回ったら `nil` を返して終わります。`fun.range` の逆向き版にあたる部品です。

## コード

```lua:line-numbers=207
local range_rev_gen = function(param, state)
    local stop, step = param[1], param[2]
    local state = state + step
    if state < stop then
        return nil
    end
    return state, state
end
```

## 前提知識

- **材料と状態**: 材料 `param` には、下限 `stop` と刻み `step` が入っています。状態 `state` は、今の数です。
- **刻みの負の値**: 逆向きに進むために、`step` は負の数として渡されます。こうすると、同じ加算の式で、減る方向の数を作れます。
- **`range` との関係**: 順向きの範囲は、同じ考え方で数を増やしていきます。逆向きは、刻みと判定が逆になります。
- **終わりの判定**: `state < stop` のとき、範囲の外に出たとみなして `nil` を返します。

## 何をしているか

### 1. 材料から下限と刻みを取り出し、次の数を求める

`param[1]` が下限、`param[2]` が刻みです。`state + step` で、次の数を求めます。刻みが負なので、数は少しずつ減ります。

```lua:line-numbers=208
    local stop, step = param[1], param[2]
    local state = state + step
```

### 2. 下限を下回ったら終わり

求めた数が下限より小さければ、範囲の外になるので、`nil` を返します。列はここで終わります。

```lua:line-numbers=210
    if state < stop then
        return nil
    end
```

### 3. 範囲の中なら、数を返す

範囲の中なら、新しい状態と同じ数を返します。状態も値も同じ数なので、そのまま列の値になります。

```lua:line-numbers=213
    return state, state
```

## ここがすごい

- **同じ形で向きを変える**: 順向きと逆向きで、加算の式は同じです。刻みの符号を変えるだけで、向きが切り替わります。
- **状態が値そのもの**: 状態と値が同じ数なので、余計な情報を持ちません。最も軽い形の列です。
- **遅延で作る**: 数は、使われるたびに一つずつ作られます。大きな範囲でも、表を作らずに済みます。
- **注意点**: 刻みが正の数で渡されると、判定が合わず、列が終わらなくなることがあります。向きと刻みの符号は、必ず揃えてください。

## まとめ

- 逆向きの列は、刻みの符号を負にすると、同じ加算の式で作れる。
- 状態と値を同じにすると、列の部品が最も簡単な形になる。
- 向きと判定の関係は、一つ決めたら他の関数でも揃えて使う。
