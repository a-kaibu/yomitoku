---
title: 複数のイテレータを同じ回数だけ進めて、組にまとめる zip
description: LuaJIT 向け関数型ライブラリ Lua Fun の zip。複数のイテレータから 1 つずつ値を取り、それを並べて返します。どれか 1 つでも尽きたら止まります。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [894, 907]
format: 2
function: zip_gen_r
difficulty: 3
tags: [イテレータ, 遅延評価, 再帰]
---

## ひとことで

`zip(...)` は、複数のイテレータから 1 つずつ値を取り出して、それらを 1 組にまとめるイテレータを作る関数です。`fun.zip(a, b)` で 2 つの列を並べると、`a` と `b` の同じ位置の値が組になって出てきます。どれか 1 つでも尽きたら、そこで止まります。

## コード

```lua:line-numbers=894
local function zip_gen_r(param, state, state_new, ...)
    if #state_new == #param / 2 then
        return state_new, ...
    end

    local i = #state_new + 1
    local gen_x, param_x = param[2 * i - 1], param[2 * i]
    local state_x, r = gen_x(param_x, state[i])
    if state_x == nil then
        return nil
    end
    table.insert(state_new, state_x)
    return zip_gen_r(param, state, state_new, r, ...)
end
```

## 前提知識

- **再帰呼び出し**: 関数が自分自身を呼ぶ書き方です。ここでは、列の数だけ同じ処理を繰り返すために使われています。
- **`#param / 2`**: 材料の表は、列ごとに 2 つずつ（生成関数と材料）入っているため、列の数はその半分です。
- **`table.insert`**: 配列の末尾に値を入れる標準関数です。

## 何をしているか

### 1. すべての列を進めたか確かめる

`#state_new` が列の数と同じになったら、集めた新しい状態と値を返して終わります。

```lua:line-numbers=895
    if #state_new == #param / 2 then
        return state_new, ...
    end
```

### 2. 次の列から 1 つ取り出す

まだ足りない列の番号 `i` を決め、その列の生成関数と材料を取り出して、1 つ進めます。どれかの列が `nil` を返したら、全体を止めます。

```lua:line-numbers=899
    local i = #state_new + 1
```

```lua:line-numbers=902
    if state_x == nil then
        return nil
    end
```

### 3. 取った値を積み、次の列へ進む

取れた状態を `state_new` に入れ、取れた値 `r` を後ろに並べたまま、自分自身を呼び直します。列の数だけ同じ形で進むので、最後には全部の値が 1 組になります。

```lua:line-numbers=906
    return zip_gen_r(param, state, state_new, r, ...)
```


補足として、`zip` は同じ位置の値を並べるので、2 つの列の対応を取るような処理に向いています。たとえば、名前の列と点数の列をまとめて、名前と点数の組を作る、といった使い方です。

## ここがすごい

- **どれか 1 つが尽きたら止まる**: 組を作れなくなった時点で止まるので、長さの違う列でも安全です。
- **再帰で列の数を扱う**: 列が 2 つでも 10 個でも、同じ 1 つの関数で処理できます。
- **状態を配列で持つ**: 各列の状態を 1 つの配列にまとめるので、途中で止めて再開するときも、どの列まで進んだかが分かります。
- **注意点**: 列が多いほど再帰が深くなります。非常に多くの列をまとめる場合は、この作りの負担を考えてください。

## まとめ

- 複数の列を同じ回数だけ進めて組にするには、列ごとに 1 つ取り出して並べる再帰が素直に書ける。
- どれか 1 つでも尽きたら止めると、長さの違う列も安全に扱える。
