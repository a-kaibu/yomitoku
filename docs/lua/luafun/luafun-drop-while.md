---
title: 条件が偽になるまで先頭を捨てる drop_while
description: LuaJIT 向け関数型ライブラリ Lua Fun の drop_while。条件が真の間は値を捨て、初めて偽になった値から後ろを残します。残りは、遅延して作られる列として返します。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [450, 460]
format: 2
function: drop_while
difficulty: 3
tags: [遅延評価, イテレータ, 関数型]
---
## ひとことで

`drop_while(fun, gen, param, state)` は、列の先頭から、条件 `fun` が真である間の値を捨てる関数です。条件が初めて偽になった値から後ろを、新しい列として返します。先頭の不要な部分を、読み飛ばしたいときに使えます。

## コード

```lua:line-numbers=450
local drop_while = function(fun, gen_x, param_x, state_x)
    assert(type(fun) == "function", "invalid first argument to drop_while")
    local pivot = nil
    while state_x ~= nil and pivot == nil do
        state_x, pivot = drop_while_x(fun, gen_x(param_x, state_x))
    end
    if state_x == nil then
        return wrap(nil_gen, nil, nil)
    end
    return wrap(drop_while_gen, {gen_x, param_x, pivot}, state_x)
end
```

## 前提知識

- **`take_while` との対比**: `take_while` は、条件が真の間の値を残します。`drop_while` は、同じ条件で、その間の値を捨てます。二つは対になっています。
- **最初の偽の値（pivot）**: 条件が偽になった最初の値です。この値から、残りの列が始まります。
- **`while` による読み飛ばし**: 条件が偽になるか、列が終わるまで、値を一つずつ進めます。
- **`drop_while_gen`**: 最初の偽の値を越えた後の列を作る、内部のイテレータの関数です。

## 何をしているか

### 1. 条件が偽になるまで、値を読み飛ばす

`while` の中で、状態を進めて値を取り出します。`drop_while_x` が、条件に従って、捨てるか止めるかを決めます。値が見つかるか、列が終わるまで続けます。

```lua:line-numbers=452
    local pivot = nil
    while state_x ~= nil and pivot == nil do
        state_x, pivot = drop_while_x(fun, gen_x(param_x, state_x))
    end
```

### 2. 列が終わっていたら、空を返す

読み飛ばしの最中に列が終わったら、残る値はありません。空の列を返して終わります。

```lua:line-numbers=456
    if state_x == nil then
        return wrap(nil_gen, nil, nil)
    end
```

### 3. 残りを、遅延して作る列として返す

偽になった値 `pivot` を、材料の一つとして持つ列を作ります。その先は、`drop_while_gen` が必要になったときに、一つずつ作ります。

```lua:line-numbers=459
    return wrap(drop_while_gen, {gen_x, param_x, pivot}, state_x)
```

## ここがすごい

- **先頭の不要な部分を一気に飛ばす**: 条件の判定を、列の先頭でだけ行います。残りの列では、もう条件を調べません。
- **残りは遅延で作られる**: 最初の偽の値を見つけるまでだけ計算し、その後は使われたときに作ります。
- **`take_while` と組み合わせられる**: 先頭を捨てたあと、必要な範囲だけを取ると、列の中の一部を切り出せます。
- **注意点**: 条件が常に真だと、列の最後まで読み飛ばしてしまい、空の列になります。条件の設計に注意してください。

## まとめ

- 先頭の不要な部分を捨てるには、条件が偽になった最初の値から残りを扱うと、無駄な判定を減らせる。
- 対になる関数と組み合わせると、列の中の好きな部分を取り出せる。
- 条件が常に真になる場合は、空の列になることを念頭に置く。
