---
title: 2 番目の引数を先に固定して、関数を部分的に使う
description: Lua のユーティリティ集 Penlight の utils.bind2。関数の 2 番目の引数を値に固定し、最初の引数と残りを受け取る新しい関数を作ります。bind1 と対になる部分適用の例です。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [846, 849]
format: 2
function: utils.bind2
difficulty: 2
tags: [関数型, クロージャ, イディオム]
---

## ひとことで

`utils.bind2(fn, p)` は、関数 `fn` の 2 番目の引数を `p` に固定した新しい関数を返します。`f(a, b, c)` を `bind2(f, "x")` で包むと、新しい関数は `a` と `c` を受け取り、`f(a, "x", c)` を呼びます。前の記事の `bind1` が 1 番目を固定するのに対して、こちらは 2 番目を固定します。

## コード

```lua:line-numbers=846
function utils.bind2 (fn,p)
    fn = utils.function_arg(1,fn)
    return function(x,...) return fn(x,p,...) end
end
```

## 前提知識

- **部分適用**: 関数の引数の一部を先に決めて、残りを受け取る新しい関数を作ることです。
- **`bind1` との違い**: `bind1` は先頭の引数を固定し、`bind2` は 2 番目を固定します。どの位置を固定するかで、使いやすい形が変わります。
- **可変長引数 `...`**: 残りの引数すべてを表します。`fn(x, p, ...)` と書くと、3 番目以降の引数がそのまま後ろに続きます。
- **`utils.function_arg`**: 渡されたものが呼べるかを確かめ、演算子の文字列も関数に変える Penlight の関数です。

## 何をしているか

### 1. 関数を確かめて整える

`utils.function_arg(1, fn)` で、`fn` が呼べるかを確かめます。`"+"` などの文字列なら、対応する関数に変わります。

```lua:line-numbers=847
    fn = utils.function_arg(1,fn)
```

### 2. 2 番目に固定した値を差し込む

返す関数は、受け取った最初の引数 `x` の後ろに、固定した `p` を置き、残りの引数を続けて `fn` を呼びます。呼ぶ側は、2 番目の値を意識する必要がありません。

```lua:line-numbers=848
    return function(x,...) return fn(x,p,...) end
```

使い方の例です。

```lua
local function show(a, b, c)
    print(a .. " " .. b .. " " .. c)
end

local withX = utils.bind2(show, "x")
withX("A", "C")   -- "A x C"
```


補足として、`bind2` は、引数の順番に意味があるライブラリ関数に特に役立ちます。たとえば、比較の関数や、区切りを受け取る関数では、2 番目の引数が設定の役割を持つことがあります。そのような設定を先に決めておき、残りの値だけを渡すと、呼び出しが短くなります。

## ここがすごい

- **位置を選んで固定できる**: 先頭だけでなく、2 番目も固定できるので、呼び出し側の引数の形に合わせた使い方ができます。
- **1 つの関数の形で済む**: `bind1` と同じ `...` の書き方で、固定する位置だけが違います。読む側は、もう一度理解し直す必要がありません。
- **注意点**: 固定する値は、包んだ時点で決まります。毎回変わる値を使いたいときは、包むたびに新しく `bind2` を作る必要があります。

## まとめ

- 2 番目の引数を固定すると、最初の引数だけを受け取る形に変えられる。
- `bind1` と `bind2` は、同じ書き方で固定する位置だけが違う、対の関数。
- 固定する値が変わるなら、包む関数を作り直す。
