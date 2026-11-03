---
title: 条件が成り立つ間だけ値を取り出し、途中で止める take_while
description: LuaJIT 向け関数型ライブラリ Lua Fun の take_while。イテレータの値を順に調べ、条件を満たさなくなった時点で終わります。終わりを実際に回さずに決められる遅延評価の例です。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [395, 398]
format: 2
function: take_while
difficulty: 2
tags: [遅延評価, イテレータ, 関数型]
---

## ひとことで

`take_while(fun, gen, param, state)` は、イテレータの値を先頭から順に取り出しながら、関数 `fun` が `true` を返す間だけ値を通し、最初に `false` になった時点で終わるイテレータを作ります。たとえば「1 から増えていく数のうち、100 未満のものだけ」を、必要な分だけ作るときに使えます。

## コード

```lua:line-numbers=395
local take_while = function(fun, gen, param, state)
    assert(type(fun) == "function", "invalid first argument to take_while")
    return wrap(take_while_gen, {fun, gen, param}, state)
end
```

実際に 1 つずつ判定する `take_while_gen_x` と `take_while_gen` も、読むのに必要なので引用します。

```lua:line-numbers=383
local take_while_gen_x = function(fun, state_x, ...)
    if state_x == nil or not fun(...) then
        return nil
    end
    return state_x, ...
end

local take_while_gen = function(param, state_x)
    local fun, gen_x, param_x = param[1], param[2], param[3]
    return take_while_gen_x(fun, gen_x(param_x, state_x))
end
```

## 前提知識

- **イテレータの 3 つ組**: `gen`（次を作る関数）、`param`（材料）、`state`（今の位置）の組です。`wrap` は、この 3 つを 1 つのイテレータの形にまとめる関数です。
- **可変長引数 `...`**: `take_while_gen_x` は、値が複数あっても、そのまま条件の関数と次の値に渡せるように `...` を使っています。
- **`nil` による終わりの合図**: イテレータは、値がなくなると `nil` を返します。`take_while` はこの合図を、条件に合わなくなったときにも出します。
- **遅延評価**: 結果を全部作らずに、必要になったときに 1 つずつ作る方式です。

## 何をしているか

### 1. 条件を満たさなければ終わりにする

`take_while_gen_x` は、今の位置が `nil`（値がない）か、条件 `fun(...)` が偽なら、`nil` を返して終わります。条件を満たしていれば、今の位置と値をそのまま返します。

```lua:line-numbers=384
    if state_x == nil or not fun(...) then
        return nil
    end
```

### 2. 次の値を取り出して判定する

`take_while_gen` は、`param` に入れておいた条件、元のイテレータ、材料を取り出し、元のイテレータから 1 つ値を取って、それを判定に回します。

```lua:line-numbers=391
    local fun, gen_x, param_x = param[1], param[2], param[3]
    return take_while_gen_x(fun, gen_x(param_x, state_x))
```

### 3. イテレータとして包む

`take_while` は、条件が関数であることを確かめてから、`wrap` で新しいイテレータを作ります。元のイテレータは、このとき一度も回りません。値が必要になったときに初めて動きます。

## ここがすごい

- **無限の列にも使える**: 1 から増え続ける数に条件をかけても、条件が偽になった時点で止まります。全部を作る必要がないので、無限の列でも使えます。
- **元のイテレータを包むだけ**: 新しい値を作らず、元の値を条件で通すか止めるかを決めるだけです。仕組みが単純なので、他の関数とも組み合わせやすくなります。
- **条件の判定を値の並びのまま渡す**: `...` を使うので、複数の戻り値を持つイテレータでも、そのまま条件に渡せます。
- **注意点**: 条件が偽になった時点で終わるので、途中に一時的な偽があると、そこで止まってしまいます。「ずっと満たす間」を意図するかを、必ず確認して使う必要があります。

## まとめ

- 値を順に調べて、条件が崩れた時点で止めるには、イテレータを包む形にすると効率がよい。
- 無限の列でも、必要な分だけ作れるのが遅延評価の強み。
- 「条件を満たす間」と「条件を満たすもの全部」は違うので、どちらを求めているかを意識する。
