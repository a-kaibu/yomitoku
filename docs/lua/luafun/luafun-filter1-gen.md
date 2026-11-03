---
title: 条件に合う最初の値まで進める filter1_gen
description: LuaJIT 向け関数型ライブラリ Lua Fun の filter1_gen。引数が一つだけの条件に合うまで、列を一つずつ進めます。条件に合った値が見つかった時点で、その値を返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [538, 544]
format: 2
function: filter1_gen
difficulty: 2
tags: [遅延評価, 探索, 関数型]
---
## ひとことで

`filter1_gen(fun, gen_x, param_x, state_x, a)` は、条件 `fun` を満たす値が見つかるまで、列を一つずつ進める関数です。条件は一つの引数で判定されます。見つかった時点の状態と値を返し、列が終わったときは `nil` を返します。引数が一つだけの場合に使われる、`filter` の内部の関数です。

## コード

```lua:line-numbers=538
local filter1_gen = function(fun, gen_x, param_x, state_x, a)
    while true do
        if state_x == nil or fun(a) then break; end
        state_x, a = gen_x(param_x, state_x)
    end
    return state_x, a
end
```

## 前提知識

- **`filter` の仕組み**: 条件に合う値だけを残す関数です。内部では、引数の数によって、`filter1_gen` と `filterm_gen` を使い分けます。
- **`a` の役割**: 今の列の値を、一つの引数として持っています。最初の判定に使われ、次の値が取れれば、そちらに置き換わります。
- **`break;`**: 繰り返しを抜ける文です。`if` の中に一行で書かれ、条件を満たした時点で、そこで止まります。
- **値と状態の両方を返す**: 次の状態と、見つけた値を、どちらも返します。列を続けて使うために必要です。

## 何をしているか

### 1. 条件を満たすか、列が終わるまで繰り返す

`while true` の中で、まず条件 `fun(a)` を調べます。条件が合うか、列の状態が `nil` ならば、`break` で繰り返しを抜けます。

```lua:line-numbers=540
        if state_x == nil or fun(a) then break; end
```

### 2. 条件に合わなければ、次の値を読む

条件に合わなければ、`gen_x` で次の状態と値を取り出して、また判定に戻ります。

```lua:line-numbers=541
        state_x, a = gen_x(param_x, state_x)
```

### 3. 見つけた状態と値を返す

繰り返しを抜けたら、今の状態と値を返します。条件に合った値なら、それが列の次の値になります。

```lua:line-numbers=543
    return state_x, a
```

## ここがすごい

- **引数一つの条件に特化**: 判定に使う値が一つだけなので、余計な可変長の処理が要りません。速く、単純に動きます。
- **必要な分だけ読む**: 条件に合う値が見つかった時点で止まるので、残りの列は読まれません。
- **遅延で動く**: 列の値は、使われるたびに一つずつ探されます。大きな列でも、全部を調べずに済みます。
- **注意点**: 条件に合う値が一つもなければ、列の最後まで読みます。長い列では、その分の時間がかかります。

## まとめ

- 条件に合う最初の値を探すときは、一つずつ読んで、合った時点で止める形にすると効率がよい。
- 引数の数に応じて処理を分けると、よく使う場合を単純に速く書ける。
- 見つかった状態を返すと、その後も列を続けて使える。
