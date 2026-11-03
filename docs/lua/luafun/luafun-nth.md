---
title: 列の n 番目の値だけを取り出す nth
description: LuaJIT 向け関数型ライブラリ Lua Fun の nth。イテレータの n 番目の値を取り出します。配列や文字列では、添字を直接使う近道があるので、列を回さずに答えを得られます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [310, 329]
format: 2
function: nth
difficulty: 2
tags: [遅延評価, 最適化, イテレータ]
---
## ひとことで

`nth(n, gen, param, state)` は、イテレータの `n` 番目の値を取り出す関数です。配列や文字列のイテレータなら、添字を直接計算して取り出すので、列を一つずつ回しません。その他の列では、`n - 1` 回進めてから値を読みます。

## コード

:::: code-group

```lua:line-numbers=310 [日本語訳]
local nth = function(n, gen_x, param_x, state_x)
    assert(n > 0, "invalid first argument to nth")
    -- 配列と文字列のための最適化
    if gen_x == ipairs_gen then
        return param_x[state_x + n]
    elseif gen_x == string_gen then
        if state_x + n <= #param_x then
            return string.sub(param_x, state_x + n, state_x + n)
        else
            return nil
        end
    end
    for _=1,n-1,1 do
        state_x = gen_x(param_x, state_x)
        if state_x == nil then
            return nil
        end
    end
    return return_if_not_empty(gen_x(param_x, state_x))
end
```

```lua:line-numbers=310 [原文]
local nth = function(n, gen_x, param_x, state_x)
    assert(n > 0, "invalid first argument to nth")
    -- An optimization for arrays and strings
    if gen_x == ipairs_gen then
        return param_x[state_x + n]
    elseif gen_x == string_gen then
        if state_x + n <= #param_x then
            return string.sub(param_x, state_x + n, state_x + n)
        else
            return nil
        end
    end
    for _=1,n-1,1 do
        state_x = gen_x(param_x, state_x)
        if state_x == nil then
            return nil
        end
    end
    return return_if_not_empty(gen_x(param_x, state_x))
end
```

::::

## 前提知識

- **`ipairs_gen` と `string_gen`**: Lua Fun が配列と文字列のために用意したイテレータの関数です。この二つは、中身が添字で決まるので、直接の計算ができます。
- **`return_if_not_empty`**: 値が空でなければ、その値を返す内部の関数です。空の場合は `nil` を返します。
- **`assert(n > 0)`**: 番号は一から数えるので、`0` 以下は受け付けません。誤りは、列を回す前に弾かれます。
- **添字の計算**: 配列の `n` 番目は、今の状態に `n` を足した位置にあります。`state_x + n` がそれにあたります。

## 何をしているか

### 1. 配列と文字列は、添字で直接取る

```lua:line-numbers=313
    if gen_x == ipairs_gen then
        return param_x[state_x + n]
    elseif gen_x == string_gen then
        if state_x + n <= #param_x then
            return string.sub(param_x, state_x + n, state_x + n)
        else
            return nil
        end
    end
```

イテレータの種類が配列か文字列なら、`param_x[state_x + n]` のように、添字を計算して取り出します。文字列は、範囲を確かめてから `string.sub` で一文字を取ります。

### 2. その他の列は、順に進めてから読む

```lua:line-numbers=322
    for _=1,n-1,1 do
        state_x = gen_x(param_x, state_x)
        if state_x == nil then
            return nil
        end
    end
```

それ以外の列では、`n - 1` 回だけ `gen_x` で状態を進めます。途中で列が終われば、`nil` を返します。

### 3. 最後に値を読む

```lua:line-numbers=328
    return return_if_not_empty(gen_x(param_x, state_x))
```

進めた状態から、もう一度 `gen_x` を呼んで値を読みます。空でなければ、その値を返します。

## ここがすごい

- **配列では計算がほぼ不要**: 添字を足すだけなので、長い配列の途中の値も、すぐに取り出せます。
- **種類ごとの近道**: 配列と文字列は特別扱いし、他の列は一般の方法で扱います。速さと汎用性を両立しています。
- **途中で止まる**: 列が途中で終わったら、すぐに `nil` を返します。余計な計算をしません。
- **注意点**: 添字の近道は、中身が配列として並んでいる場合に限ります。`n` が大きすぎると、添字が範囲外になり、`nil` が返ります。

## まとめ

- 特定の番号の値だけが必要なら、列の種類に応じた近道を用意すると、速く答えられる。
- 近道が使えない場合に備えて、一般の方法も残しておくと、どの列にも対応できる。
- 番号の範囲は、列を回す前に確かめておくと、誤りを早く見つけられる。
