---
title: 複数の関数を 1 つにまとめて、同じ引数で順に呼ぶ
description: Lua の小さなユーティリティ集 lume の combine。関数をいくつか渡すと、それらを順に呼ぶ 1 つの関数を返します。nil は無視し、関数でない値は弾きます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [507, 527]
format: 2
function: lume.combine
difficulty: 2
tags: [関数型, イディオム, クロージャ]
---

## ひとことで

`lume.combine(f1, f2, ...)` は、渡された関数を 1 つにまとめた関数を返します。まとめた関数を呼ぶと、中の関数が渡された順に、同じ引数で呼ばれます。イベントに複数の処理を登録したいときなどに使えます。

## コード

```lua:line-numbers=507
function lume.combine(...)
  local n = select('#', ...)
  if n == 0 then return noop end
  if n == 1 then
    local fn = select(1, ...)
    if not fn then return noop end
    assert(iscallable(fn), "expected a function or nil")
    return fn
  end
  local funcs = {}
  for i = 1, n do
    local fn = select(i, ...)
    if fn ~= nil then
      assert(iscallable(fn), "expected a function or nil")
      funcs[#funcs + 1] = fn
    end
  end
  return function(...)
    for _, f in ipairs(funcs) do f(...) end
  end
end
```

関数の外で使う `noop` と `iscallable` も、読むのに必要なので引用します。

```lua:line-numbers=36
local noop = function()
end
```

```lua:line-numbers=51
local iscallable = function(x)
  if type(x) == "function" then return true end
  local mt = getmetatable(x)
  return mt and mt.__call ~= nil
end
```

## 前提知識

- **可変長引数**: `...` は、関数に渡された引数すべてを表します。`select("#", ...)` で数を、`select(i, ...)` で i 番目を取り出せます。
- **`nil` の扱い**: `select` で `nil` の引数があると、そこを飛ばして数えるか、そのまま `nil` として扱うかを決める必要があります。この関数では、`nil` を無視します。
- **`ipairs`**: 配列を先頭から順に回すイテレータです。`funcs` の順に関数を呼ぶために使われています。
- **メタテーブルの `__call`**: テーブルを関数のように呼べるようにする仕組みです。`iscallable` は、関数と `__call` を持つテーブルの両方を「呼べるもの」として扱います。

## 何をしているか

### 1. 引数の数で早道を作る

引数が 0 個なら、何もしない `noop` を返します。引数が 1 個なら、その関数（または `nil`）をそのまま返します。まとめる必要がないので、余計な箱を作りません。

```lua:line-numbers=508
  local n = select('#', ...)
  if n == 0 then return noop end
  if n == 1 then
    local fn = select(1, ...)
    if not fn then return noop end
    assert(iscallable(fn), "expected a function or nil")
    return fn
  end
```

### 2. `nil` を除き、呼べるものだけを集める

2 個以上の場合は、`funcs` という配列に、`nil` ではない関数を順に入れていきます。`iscallable` で確かめ、呼べないものはエラーにします。

```lua:line-numbers=516
  local funcs = {}
  for i = 1, n do
    local fn = select(i, ...)
    if fn ~= nil then
      assert(iscallable(fn), "expected a function or nil")
      funcs[#funcs + 1] = fn
    end
  end
```

### 3. まとめた関数を返す

返す関数は、`funcs` を先頭から順に回して、受け取った引数をそのまま渡します。戻り値は捨てられるので、呼ぶ側には何も返しません。

```lua:line-numbers=524
  return function(...)
    for _, f in ipairs(funcs) do f(...) end
  end
```

## ここがすごい

- **「呼ぶだけ」の関数に特化**: 戻り値を集めないので、実装が短くなっています。複数の処理をまとめて実行するという目的に絞った設計です。
- **無効な値を前もって弾く**: `nil` を除き、呼べないものはエラーにするので、後で呼んだときに思わぬ場所で落ちることがありません。
- **1 個の場合に箱を作らない**: 引数が 1 個のときは、その関数自身を返します。余計な処理が挟まらないので、速度の面でも有利です。
- **注意点**: 途中の関数がエラーを出すと、後ろの関数は呼ばれずに止まります。戻り値が必要な場合は、この関数は向いていません。

## まとめ

- 複数の処理を 1 つにまとめるには、配列に入れて順に呼ぶ関数を返すと簡単に書ける。
- 可変長引数の `nil` は、呼ぶ前に取り除くと後の処理が単純になる。
- 特別な数の場合（0 個、1 個）には、箱を作らずに済む近道を用意すると、読みやすく速くなる。
