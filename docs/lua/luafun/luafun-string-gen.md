---
title: 文字列を一文字ずつ返すイテレータ string_gen
description: LuaJIT 向け関数型ライブラリ Lua Fun の string_gen。文字列の位置を状態として数え、一文字ずつ取り出すイテレータの関数です。文字列を列として扱うための土台です。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [92, 99]
format: 2
function: string_gen
difficulty: 1
tags: [文字列処理, イテレータ, 遅延評価]
---
## ひとことで

`string_gen(param, state)` は、文字列を一文字ずつ取り出すイテレータの関数です。状態は、今の位置を表す数で、呼ばれるたびに一つ進みます。文字列の末尾を越えると `nil` を返して、列の終わりを知らせます。Lua Fun が、文字列を他のイテレータと同じ形で扱うための部品です。

## コード

```lua:line-numbers=92
local string_gen = function(param, state)
    local state = state + 1
    if state > #param then
        return nil
    end
    local r = string.sub(param, state, state)
    return state, r
end
```

## 前提知識

- **イテレータの関数（gen）**: `gen(param, state)` の形で、次の状態と値を返す関数です。Lua Fun の列は、この関数と材料、状態の組で表されます。
- **状態と材料**: ここでは、材料 `param` が文字列そのもの、状態 `state` が今の位置です。
- **`string.sub(s, i, i)`**: 文字列の `i` 番目の一文字を取り出す標準関数です。範囲が一文字なので、その文字だけが返ります。
- **`nil` による終わり**: 状態が範囲を越えたら `nil` を返すことで、`for` の繰り返しが止まります。

## 何をしているか

### 1. 状態を一つ進める

`state + 1` で、次の位置を求めます。位置は、一文字目から数えて、一つずつ増えていきます。

```lua:line-numbers=93
    local state = state + 1
```

### 2. 末尾を越えたら終わりにする

次の位置が文字列の長さより大きければ、`nil` を返します。これで、列の終わりが示されます。

```lua:line-numbers=94
    if state > #param then
        return nil
    end
```

### 3. 一文字を取り出して返す

範囲の中なら、`string.sub` で一文字を取り出します。返すのは、新しい状態と、その文字です。

```lua:line-numbers=97
    local r = string.sub(param, state, state)
    return state, r
```

## ここがすごい

- **文字列も列の仲間入り**: 配列や範囲と同じ形で、文字列を回せます。文字列の処理も、他の列の関数に任せられます。
- **状態は数一つ**: 今の位置だけを覚えるので、軽い作りです。途中から再開するのも簡単です。
- **必要な分だけ作る**: 文字は、使われるたびに一つずつ取り出されます。長い文字列でも、全体を分けて持つ必要がありません。
- **注意点**: 一文字ずつなので、UTF-8 の多バイト文字は、途中で分かれてしまいます。日本語のような文字は、この関数の単位では扱えません。

## まとめ

- 文字列を列として扱うには、位置を状態にして一文字ずつ返す関数を作ると、他の列と同じ形で扱える。
- 終わりを `nil` で示すと、呼ぶ側の繰り返しが自然に止まる。
- 文字の単位は、バイトか文字かを意識して選ぶ。
