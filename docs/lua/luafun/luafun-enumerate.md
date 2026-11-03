---
title: 値の前に通し番号を付けて返す、enumerate のイテレータ
description: LuaJIT 向け関数型ライブラリ Lua Fun の enumerate。元のイテレータの値を、「番号と値の組」に包んで返します。状態に番号と元の状態を一緒に持たせる書き方がポイントです。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [860, 862]
format: 2
function: enumerate
difficulty: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`enumerate(gen, param, state)` は、元のイテレータの値に、0 からではなく 1 から始まる通し番号を付けて返すイテレータを作ります。`fun.enumerate(fun.range(3))` は、`{1, 1}`、`{2, 2}`、`{3, 3}` のような「番号と値」の組を順に作ります。番号と元の状態を、どちらも 1 つの状態に持たせるのが特徴です。

## コード

```lua:line-numbers=860
local enumerate = function(gen, param, state)
    return wrap(enumerate_gen, {gen, param}, {1, state})
end
```

次の値を作る 2 つの関数も、読むのに必要なので引用します。

```lua:line-numbers=847
local enumerate_gen_call = function(_state, i, state_x, ...)
    if state_x == nil then
        return nil
    end
    return {i + 1, state_x}, i, ...
end
```

```lua:line-numbers=854
local enumerate_gen = function(param, state)
    local gen_x, param_x = param[1], param[2]
    local i, state_x = state[1], state[2]
    return enumerate_gen_call(state, i, gen_x(param_x, state_x))
end
```

## 前提知識

- **イテレータの 3 つ組**: `gen`（次を作る関数）、`param`（材料）、`state`（今の位置）の組です。`enumerate` は、元の 3 つ組を包んで、新しい 3 つ組を作ります。
- **状態（state）の中身**: ここでは `state` は `{番号, 元の状態}` という表です。毎回新しい表を作るので、元の状態を壊しません。
- **可変長引数 `...`**: 元のイテレータが複数の値を返す場合でも、それを後ろにそのまま残すための書き方です。
- **`wrap`**: 3 つ組をライブラリのイテレータの形にまとめる関数です。

## 何をしているか

### 1. 元の状態を取り出して、次の値を得る

`enumerate_gen` は、状態 `{i, state_x}` から番号 `i` と元の状態を取り出し、元のイテレータを 1 回動かします。

```lua:line-numbers=855
    local gen_x, param_x = param[1], param[2]
    local i, state_x = state[1], state[2]
    return enumerate_gen_call(state, i, gen_x(param_x, state_x))
```

### 2. 値があれば番号を付けて返す

`enumerate_gen_call` は、元の状態が `nil`（値がない）なら終わりの `nil` を返します。値があれば、`{i + 1, state_x}`（次の状態）と `i`（今の番号）を返します。元の値 `...` は、その後ろに続きます。

```lua:line-numbers=848
    if state_x == nil then
        return nil
    end
    return {i + 1, state_x}, i, ...
```

### 3. 番号は 1 から始める

`enumerate` は、最初の状態を `{1, state}` として作ります。番号は 1 から始まり、値を 1 つ返すたびに 1 増えます。

```lua:line-numbers=861
    return wrap(enumerate_gen, {gen, param}, {1, state})
```

## ここがすごい

- **番号を状態に持たせる**: 番号を外の変数に持つのではなく、状態の一部として持ちます。イテレータは状態だけで続きを再現できるので、途中から再開するなどにも向いています。
- **毎回新しい状態を作る**: `{i + 1, state_x}` と新しい表を作るので、前の状態は変わりません。一つの状態を何度使っても、結果が混ざらない設計です。
- **元の値を崩さない**: 元のイテレータが複数の値を返しても、`...` で後ろにそのまま渡すので、情報が失われません。
- **注意点**: 毎回新しい表を作るので、大量の値を回すと、そのぶんメモリの割り当てが増えます。必要な値だけを使うときは、そこを意識すると良いです。

## まとめ

- 番号付きの値を作るには、番号と元の状態を 1 つの状態として持たせると、途中からの再開もできる。
- 状態は毎回作り直すと、前の状態を壊さずに済む。
- 元の値の追加の戻り値は、`...` で後ろへそのまま渡すと情報を失わない。
