---
title: 複数のイテレータを続けて回す chain
description: LuaJIT 向け関数型ライブラリ Lua Fun の chain。渡された複数のイテレータを、前の列が尽きたら次の列へ移りながら、1 本の列として回します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [990, 1007]
format: 2
function: chain
difficulty: 3
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`chain(...)` は、いくつかのイテレータを受け取り、それらを順番につないだ 1 本のイテレータを作る関数です。最初のイテレータの値を全部出したら、次のイテレータへ移ります。配列を続けて回るときと同じ感覚で、複数の列を 1 つの列として扱えます。

## コード

```lua:line-numbers=990
local chain = function(...)
    local n = numargs(...)
    if n == 0 then
        return wrap(nil_gen, nil, nil)
    end

    local param = { [3 * n] = 0 }
    local gen_x, param_x, state_x
    for i=1,n,1 do
        local elem = select(i, ...)
        gen_x, param_x, state_x = iter(elem)
        param[3 * i - 2] = gen_x
        param[3 * i - 1] = param_x
        param[3 * i] = state_x
    end

    return wrap(chain_gen_r1, param, {1, param[3]})
end
```

## 前提知識

- **イテレータの 3 つ組**: 各列は `gen`、`param`、`state` の組で表されます。`chain` は、この 3 つを列ごとに覚えておきます。
- **`numargs`**: 引数の数を数える、Lua Fun の内部関数です。ライブラリのイテレータが渡された場合に、末尾の余計な値を除く働きもします。
- **`select(i, ...)`**: `i` 番目の引数を取り出す標準関数です。
- **`wrap`**: 3 つ組をライブラリのイテレータの形にまとめる関数です。

## 何をしているか

### 1. 各列の 3 つ組を取り出して並べる

`for` で各引数を取り出し、`iter` で 3 つ組に直します。それぞれを `param` という 1 つの配列に、順番どおりに並べて入れます。列 `i` の情報は、`3 * i - 2` から `3 * i` の位置にあります。

```lua:line-numbers=998
    for i=1,n,1 do
        local elem = select(i, ...)
        gen_x, param_x, state_x = iter(elem)
        param[3 * i - 2] = gen_x
        param[3 * i - 1] = param_x
        param[3 * i] = state_x
    end
```

### 2. 最初の列から始める

状態は `{1, 最初の列の状態}` です。1 は、今いる列の番号を表します。`chain_gen_r1` が、その番号の列から値を取ります。

```lua:line-numbers=1006
    return wrap(chain_gen_r1, param, {1, param[3]})
```

### 3. 0 個の引数の場合

引数がなければ、値のない `nil_gen` を返します。すぐに尽きるイテレータになります。


補足として、`chain` は前の列の状態を保ったまま、次の列へ移るので、途中で止めて再開しても、どの列のどこにいたかが分かります。これは、状態を配列に持たせているからこその性質です。列を増やしても、配列の長さが増えるだけで、書き方は変わりません。

## ここがすごい

- **1 本の配列に見せる**: 列の切り替えは内部だけで行われ、呼ぶ側は 1 本の列として扱えます。
- **列を平らに並べる**: 3 つ組を 1 つの配列に並べるので、列が増えても同じ書き方で済みます。
- **列の切り替えを状態で表す**: 今どの列にいるかを、状態の最初の数字で持っています。途中で止めて再開しても、続きが分かります。
- **注意点**: 途中の列が無限だと、後ろの列は一生出てきません。無限の列は、最後に置くか、`take` で切ってからつなぎます。

## まとめ

- 複数の列を続けて回るには、列ごとの 3 つ組を並べ、今の列の番号を状態に持たせる。
- 無限の列は、つなぐ位置に注意する。
