---
title: 条件で列を二つに振り分ける partition
description: LuaJIT 向け関数型ライブラリ Lua Fun の partition。条件に合う値の列と、合わない値の列の二つを作ります。元の列は、それぞれの列を使うときに、もう一度回されます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [594, 600]
format: 2
function: partition
difficulty: 2
tags: [遅延評価, イテレータ, 関数型]
---
## ひとことで

`partition(fun, gen, param, state)` は、一つの列を、条件 `fun` に合うものと合わないものの二つに振り分ける関数です。結果は、合うものの列と、合わないものの列の順で返ります。どちらの列も遅延して作られるので、使うまで計算は起きません。

## コード

```lua:line-numbers=594
local partition = function(fun, gen, param, state)
    local neg_fun = function(...)
        return not fun(...)
    end
    return filter(fun, gen, param, state),
           filter(neg_fun, gen, param, state)
end
```

## 前提知識

- **`filter`**: 条件に合う値だけを残す関数です。`partition` は、この `filter` を二回使って、二つの列を作ります。
- **否定の関数**: `neg_fun` は、`fun` の結果を反転させた関数です。条件に合わない値だけを残すために使います。
- **可変長引数 `...`**: `neg_fun` は、どんな数の引数でも受けて、そのまま `fun` に渡します。条件の引数の数に関係なく使えます。
- **複数の戻り値**: 二つの列を、カンマで区切って一度に返します。

## 何をしているか

### 1. 条件を反転させた関数を作る

`neg_fun` は、`fun(...)` の結果を `not` で反転させた関数です。引数はすべて、そのまま `fun` へ渡されます。

```lua:line-numbers=595
    local neg_fun = function(...)
        return not fun(...)
    end
```

### 2. 二つのフィルタを、同じ列から作る

`filter(fun, ...)` で、条件に合う列を作ります。続けて、`filter(neg_fun, ...)` で、合わない列を作ります。どちらも、同じ `gen`、`param`、`state` から出発します。

```lua:line-numbers=598
    return filter(fun, gen, param, state),
           filter(neg_fun, gen, param, state)
```

## ここがすごい

- **二つの列を一度に**: 条件を一つ書くだけで、合うものと合わないものの両方が手に入ります。振り分けの対応が、ずれることがありません。
- **条件の反転が一か所**: 否定の関数を一つ作れば、残りの列はそれを使うだけです。二つの条件が、必ず補い合う形になります。
- **遅延で計算する**: 二つの列は、使われたときに作られます。使わない側の列は、計算されません。
- **注意点**: 列を二回回すので、元の列の計算が重いと、全体の時間は約二倍になります。また、条件に副作用があると、二回の呼び出しで結果が変わることがあります。

## まとめ

- 条件による振り分けは、条件と反転した条件で二つの列を作ると、必ず過不足なく分けられる。
- 遅延の列は、使う側だけが計算されるので、片方だけ使う場合も無駄がない。
- 元の列を二回回すことになるので、計算の重さと副作用には注意する。
