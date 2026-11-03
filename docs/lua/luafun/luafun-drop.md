---
title: 数なら個数、関数なら条件で先頭を捨てる drop
description: LuaJIT 向け関数型ライブラリ Lua Fun の drop。第一引数が数なら drop_n、関数なら drop_while へ振り分けます。take と対になる、先頭を捨てるための入口です。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [464, 472]
format: 2
function: drop
difficulty: 1
tags: [イディオム, 関数型, 可読性]
---
## ひとことで

`drop(n_or_fun, gen, param, state)` は、列の先頭の値を捨てる関数です。第一引数が数なら、その個数だけ捨てます。関数なら、条件が真の間の値を捨てます。`take` と対になる関数で、どちらも同じ引数の形を使います。

## コード

```lua:line-numbers=464
local drop = function(n_or_fun, gen_x, param_x, state_x)
    if type(n_or_fun) == "number" then
        return drop_n(n_or_fun, gen_x, param_x, state_x)
    else
        return drop_while(n_or_fun, gen_x, param_x, state_x)
    end
end
methods.drop = method1(drop)
exports.drop = export1(drop)
```

## 前提知識

- **`drop_n` と `drop_while`**: 個数で捨てる `drop_n` と、条件で捨てる `drop_while` の二つです。`drop` は、この二つへ振り分けます。
- **`take` との対**: `take` は残す、`drop` は捨てる、という関係です。`take` と `drop` を組み合わせると、列の一部を切り出せます。
- **引数の型による分岐**: `type(n_or_fun) == "number"` で、個数か条件かを決めます。
- **同じ引数の形**: 列の材料と状態の並びは、`take` と同じです。だから、同じ書き方で二つを入れ替えて使えます。

## 何をしているか

### 1. 引数の型で振り分けを決める

第一引数が数かどうかを調べます。数なら個数、それ以外なら条件として扱います。

```lua:line-numbers=465
    if type(n_or_fun) == "number" then
```

### 2. 個数なら drop_n、条件なら drop_while に任せる

数なら、`drop_n` で先頭の個数を捨てます。関数なら、`drop_while` で条件が偽になるまで捨てます。どちらも、列の残りを新しい列として返します。

```lua:line-numbers=466
        return drop_n(n_or_fun, gen_x, param_x, state_x)
    else
        return drop_while(n_or_fun, gen_x, param_x, state_x)
```

## ここがすごい

- **`take` と同じ形で書ける**: 呼び出しの書き方が揃っているので、覚えるのが簡単です。残すか捨てるかを、名前で選ぶだけで済みます。
- **振り分けの処理が一か所**: 型による判定を、この関数に集めています。仕組みを変えるときも、ここを見ればよいです。
- **中身は専門の関数に任せる**: 捨てる処理そのものは、`drop_n` と `drop_while` が担当します。役割が分かれて読みやすいです。
- **注意点**: 数が大きすぎる、または条件が常に真だと、列の大部分が捨てられて空になります。結果が空になる場合もあると考えてください。

## まとめ

- 残すと捨てるを対の関数にすると、列の切り出しを組み立てやすい。
- 同じ引数の形を揃えておくと、二つの関数を入れ替えて使える。
- 振り分けは一か所にまとめると、後の変更が小さくて済む。
