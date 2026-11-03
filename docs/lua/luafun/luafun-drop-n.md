---
title: 先頭 n 個を読み捨てる drop_n
description: LuaJIT 向け関数型ライブラリ Lua Fun の drop_n。イテレータの先頭 n 個の値を読み捨て、残りを新しいイテレータとして返します。途中で終わったら、空のイテレータを返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [412, 421]
format: 2
function: drop_n
difficulty: 2
tags: [遅延評価, イテレータ, 防御的プログラミング]
---
## ひとことで

`drop_n(n, gen, param, state)` は、イテレータの先頭から `n` 個の値を読み捨てて、その後ろの値を新しいイテレータとして返す関数です。`take_n` が先頭を取るのに対して、`drop_n` は先頭を捨てます。途中で列が終わったときは、空のイテレータを返します。

## コード

```lua:line-numbers=412
local drop_n = function(n, gen, param, state)
    assert(n >= 0, "invalid first argument to drop_n")
    for _=1,n,1 do
        state = gen(param, state)
        if state == nil then
            return wrap(nil_gen, nil, nil)
        end
    end
    return wrap(gen, param, state)
end
```

## 前提知識

- **`take_n` との対比**: `take_n` は先頭から数個を残し、`drop_n` は先頭から数個を捨てます。二つを組み合わせると、列の一部だけを切り出せます。
- **`nil` による終わりの判定**: イテレータの次の状態が `nil` になると、列は終わりです。読み捨ての途中で `nil` が出たら、それ以上の値はありません。
- **`for _=1,n,1 do`**: `1` から `n` まで回す数値の繰り返しです。`_` は使わない変数を表す慣習的な名前です。
- **`wrap`**: 3 つ組を、Lua Fun の扱うイテレータの形にまとめる関数です。

## 何をしているか

### 1. 指定の数だけ、先へ進める

`n` 回、`gen(param, state)` を呼んで、状態を一つずつ進めます。値は使わず、位置だけを進めます。

```lua:line-numbers=413
    assert(n >= 0, "invalid first argument to drop_n")
    for _=1,n,1 do
        state = gen(param, state)
```

### 2. 途中で終わったら空にする

読み捨ての途中で状態が `nil` になったら、列が足りなかったことになります。その場合は、空のイテレータ `nil_gen` を返します。

```lua:line-numbers=416
        if state == nil then
            return wrap(nil_gen, nil, nil)
        end
```

### 3. 残りを新しいイテレータとして返す

すべて読み捨てられたら、元の `gen` と `param` に、進めた `state` を組にして返します。以降は、残りの値を順に作れます。

```lua:line-numbers=420
    return wrap(gen, param, state)
```

## ここがすごい

- **一回の処理で位置を合わせる**: 読み捨ての回数だけ、先へ進めておくので、後の処理は残りだけを見れば済みます。
- **値を作らない読み捨て**: 読み捨てる値は使わないので、その値の結果を保持しません。メモリを使わずに、位置を進められます。
- **不足を空で表す**: 列が足りないときを、エラーにせず、空のイテレータとして扱います。呼ぶ側は、結果が空かどうかを確かめれば済みます。
- **注意点**: 読み捨てるたびに `gen` が呼ばれるので、列の計算が重いと、`drop_n` の呼び出し自体が重くなります。大きな `n` では、その点を意識してください。

## まとめ

- 先頭を捨てるときは、状態を進めるだけにすると、値の保持を避けられる。
- 途中で列が終わる場合を、空のイテレータで表すと、呼ぶ側の判定が単純になる。
- 遅延の列では、読み捨ての回数がそのまま計算の量になるので、大きさを見積もっておく。
