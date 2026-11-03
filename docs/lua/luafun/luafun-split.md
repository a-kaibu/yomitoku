---
title: 同じ列を先頭と残りの二つに分ける split
description: LuaJIT 向け関数型ライブラリ Lua Fun の split。同じ列から、先頭 n 個の列と、残りの列の二つを作ります。どちらも遅延して作られ、値は必要なときに計算されます。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [474, 477]
format: 2
function: split
difficulty: 2
tags: [遅延評価, イテレータ, 関数型]
---
## ひとことで

`split(n_or_fun, gen, param, state)` は、一つのイテレータを、先頭の部分と残りの部分の二つに分ける関数です。引数の `n_or_fun` に数を渡すと個数で、関数を渡すとその条件が偽になるまでで分けます。値は分けた時点では計算されず、使われたときに作られます。

## コード

```lua:line-numbers=474
local split = function(n_or_fun, gen_x, param_x, state_x)
    return take(n_or_fun, gen_x, param_x, state_x),
           drop(n_or_fun, gen_x, param_x, state_x)
end
```

## 前提知識

- **`take` と `drop`**: `take` は先頭の部分を取り、`drop` は先頭を捨てた残りを取ります。`split` は、この二つを同じ条件で組み合わせた関数です。
- **複数の戻り値**: Lua の関数は、カンマで区切って二つの値を返せます。`split` は、先頭の列と残りの列の二つを返します。
- **遅延評価**: 値を、必要になるまで計算しない考え方です。分けた時点では、どちらの列も、まだ一つも値を作っていません。
- **状態の出発点**: イテレータは、同じ `gen`、`param`、`state` から出発します。`take` と `drop` は、その同じ出発点を、それぞれ別々に使います。

## 何をしているか

### 1. 先頭の部分を作る

`take(n_or_fun, gen_x, param_x, state_x)` は、先頭の部分の列を作ります。この時点では、値は計算されません。

```lua:line-numbers=475
    return take(n_or_fun, gen_x, param_x, state_x),
```

### 2. 残りの部分を作る

`drop(...)` は、同じ出発点から、先頭を捨てた列を作ります。二つ目の戻り値として返されます。

```lua:line-numbers=476
           drop(n_or_fun, gen_x, param_x, state_x)
```

## ここがすごい

- **一回の指定で二つに分かれる**: 個数や条件を一度だけ書けば、先頭と残りの両方が決まります。書き間違いで、境界がずれる心配がありません。
- **計算は遅延する**: 分けた時点では、どちらの列も計算されません。大きな列でも、使う分だけが計算されます。
- **条件でも分けられる**: 関数を渡すと、条件が偽になる位置で分かれます。個数が分からないときにも使えます。
- **注意点**: 同じ出発点から二度計算するので、元の `gen` に副作用があると、二つの列で結果が食い違うことがあります。副作用のないイテレータで使ってください。

## まとめ

- 列を二つに分けるときは、同じ条件で取る部分と捨てる部分を組み合わせると、境界を揃えられる。
- 遅延の列では、分けた時点では計算が起きないので、大きな列も軽く扱える。
- 副作用のある列は、二度計算されることを意識して避ける。
