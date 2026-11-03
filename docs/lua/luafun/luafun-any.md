---
title: 一つでも真なら止まる、any の早期終了
description: LuaJIT 向け関数型ライブラリ Lua Fun の any。イテレータの値を調べ、条件が真になった時点で止めます。全部を調べずに、1 つあればよい問い合わせに向いています。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [680, 686]
format: 2
function: any
difficulty: 1
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`any(fun, gen, param, state)` は、イテレータの値の中に、条件 `fun` を満たすものが 1 つでもあるかを調べる関数です。見つかった時点で止まるので、残りの値は作られません。値が 1 つもなければ `false` を返します。`all` の反対の形です。

## コード

```lua:line-numbers=680
local any = function(fun, gen_x, param_x, state_x)
    local r
    repeat
        state_x, r = call_if_not_empty(fun, gen_x(param_x, state_x))
    until state_x == nil or r
    return not not r
end
```

## 前提知識

- **早期終了**: 答えが決まった時点で、残りを調べずに止める考え方です。
- **`repeat ... until`**: 条件を満たすまで繰り返す Lua の文法です。
- **`not not`**: 値を真偽値の `true` か `false` に変える書き方です。`r` が `nil` のときも `false` になります。
- **`call_if_not_empty`**: 値が残っていれば条件を当てて結果を返す、Lua Fun の内部関数です。

## 何をしているか

### 1. 次の値に条件を当てる

`call_if_not_empty` は、値が残っているときだけ `fun` を当てた結果 `r` を返します。値が尽きていれば `nil` を返します。

```lua:line-numbers=683
        state_x, r = call_if_not_empty(fun, gen_x(param_x, state_x))
```

### 2. 真が出たら止める

`until state_x == nil or r` は、値が尽きたか、条件が真になったときに抜けます。真が見つかった時点で、残りの値は作られません。

```lua:line-numbers=684
    until state_x == nil or r
```

### 3. 結果を真偽値にする

`return not not r` で、結果を `true` か `false` にそろえて返します。


補足として、`any` は「真が 1 つあれば答えが決まる」という性質を使っています。そのため、条件が重い計算でも、真が早く出る列なら、全体の半分も調べずに済みます。逆に、真が最後にしか出ない列では、全部を調べることになります。どちらになるかは列の並びによるので、使う前に列の性質を考えておくと、速さの見込みが立ちます。

## ここがすごい

- **真が出た時点で止まる**: 無限の列でも、条件を満たす値があれば、必ず終わります。
- **`all` と対になる**: `all` は偽で止まり、`any` は真で止まります。対の関係を覚えると、どちらも読みやすくなります。
- **注意点**: 空の列は `false` です。「1 つもないなら true」とは違うので、扱いに注意してください。

## まとめ

- 1 つでも条件を満たすかを調べるには、真が出た時点で止めると速い。
- `all` と `any` は、止まる条件が逆の対の関数として覚えると分かりやすい。
