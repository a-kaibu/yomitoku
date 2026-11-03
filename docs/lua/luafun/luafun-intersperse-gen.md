---
title: 値を一つおきに挟む intersperse_gen の状態
description: LuaJIT 向け関数型ライブラリ Lua Fun の intersperse_gen。列の値の間に、決まった値を挟んで返すイテレータの関数です。状態の偶奇で、挟む値と元の値を交互に返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [873, 881]
format: 2
function: intersperse_gen
difficulty: 3
tags: [遅延評価, イテレータ, イディオム]
---
## ひとことで

`intersperse_gen(param, state)` は、列の値の間に、決まった値 `x` を挟んで返すイテレータの関数です。状態の番号 `i` が奇数のときは `x` を返し、偶数のときは元の列の値を返します。`i` の偶奇で、挟む値と元の値を交互に切り替えます。

## コード

```lua:line-numbers=873
local intersperse_gen = function(param, state)
    local x, gen_x, param_x = param[1], param[2], param[3]
    local i, state_x = state[1], state[2]
    if i % 2 == 1 then
        return {i + 1, state_x}, x
    else
        return intersperse_call(i, gen_x(param_x, state_x))
    end
end
```

## 前提知識

- **状態の組 `{i, state_x}`**: 挟む位置を数える番号 `i` と、元の列の状態を、一つの表にまとめたものです。
- **偶奇の判定 `i % 2 == 1`**: 番号を `2` で割った余りが `1` なら奇数です。奇数と偶数で、返す値を変えるための判定です。
- **材料 `{x, gen_x, param_x}`**: 挟む値 `x` と、元の列の三つ組をまとめた材料です。
- **`intersperse_call`**: 元の列から次の値を取り出し、状態の番号を一つ進める内部の関数です。

## 何をしているか

### 1. 材料と状態を取り出す

`param` から、挟む値と元の列の三つ組を取り出します。`state` から、番号と元の列の状態を取り出します。

```lua:line-numbers=874
    local x, gen_x, param_x = param[1], param[2], param[3]
    local i, state_x = state[1], state[2]
```

### 2. 奇数番目なら、挟む値を返す

番号 `i` が奇数のときは、元の列の値を読まずに、挟む値 `x` を返します。番号だけを一つ進めて、次の状態にします。

```lua:line-numbers=876
    if i % 2 == 1 then
        return {i + 1, state_x}, x
```

### 3. 偶数番目なら、元の列の値を返す

番号 `i` が偶数のときは、元の列から次の値を取り出して返します。取り出せなければ、そこで列は終わります。

```lua:line-numbers=878
    else
        return intersperse_call(i, gen_x(param_x, state_x))
    end
```

## ここがすごい

- **状態で交互を表す**: 「今どちらを返すか」を、番号の偶奇だけで決めています。余計な変数が要りません。
- **元の列を読むのは必要なときだけ**: 挟む値の番では、元の列を読まないので、無駄な処理がありません。
- **遅延で作られる**: 値は使われるたびに一つずつ作られるので、長い列にも、表を作らずに対応できます。
- **注意点**: 挟む値の位置は、番号の偶奇で決まります。列の終わりの扱いは、この実装の振る舞いとして理解しておく必要があります。

## まとめ

- 交互に値を返す仕組みは、番号の偶奇で切り替えると、状態を一つにまとめられる。
- 挟む値の番では、元の列を読まないようにすると、無駄な処理を避けられる。
- 遅延の列の状態は、偶奇や位置のような小さな情報で表すと、軽く保てる。
