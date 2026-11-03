---
title: 条件で二つの値を選ぶ、三項演算子の代わり
description: Lua のユーティリティ集 Penlight の utils.choose。Lua には三項演算子がないため、条件に応じて二つの値のどちらかを返す関数で、その代わりをします。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [144, 150]
format: 2
function: utils.choose
difficulty: 1
tags: [イディオム, 可読性, 関数型]
---
## ひとことで

`utils.choose(cond, value1, value2)` は、条件 `cond` が真なら `value1`、偽なら `value2` を返す関数です。多くの言語にある「三項演算子」（`cond ? a : b`）に近い働きをします。Lua には三項演算子がないので、一行で条件による選び分けを書きたいときに使えます。

## コード

```lua:line-numbers=144
function utils.choose(cond, value1, value2)
    if cond then
        return value1
    else
        return value2
    end
end
```

## 前提知識

- **真と偽の判定**: Lua では、`nil` と `false` だけが偽です。それ以外の値、たとえば `0` や空の文字列は真として扱われます。
- **`and` と `or` での代用**: Lua では `cond and a or b` と書いて、三項演算子に似た結果を得る書き方がよく使われます。ただし、`a` が `nil` か `false` のときは `b` が選ばれてしまうという罠があります。
- **関数の引数**: 引数は、呼ぶときに値として渡されます。`choose` は、両方の値をあらかじめ計算してから渡すことになります。

## 何をしているか

### 1. 条件が真なら一つ目の値を返す

`cond` が真なら、`value1` をそのまま返します。

```lua:line-numbers=145
    if cond then
        return value1
```

### 2. 偽なら二つ目の値を返す

それ以外のときは、`value2` を返します。

```lua:line-numbers=147
    else
        return value2
```

## ここがすごい

- **`and` と `or` の罠を避けられる**: 三項演算子の代わりに `cond and a or b` と書くと、`a` が `false` や `nil` のときに、意図しない `b` が返ります。`choose` は `if` で分けるので、その心配がありません。
- **読みやすさ**: 関数名だけで、条件による選択だと分かります。引数の並びも「条件、真の値、偽の値」の順で、慣れると自然です。
- **注意点**: 引数はどちらも、呼ぶ前に評価されます。`value2` の計算が重い場合や、副作用がある場合は、条件に応じて計算を分ける書き方の方が安全です。

## まとめ

- 三項演算子がない言語では、条件による選択を関数にまとめると、読みやすくなる。
- `cond and a or b` は、`a` が偽の値のときに壊れやすいので、注意して使う。
- 引数は先に評価されるので、重い計算があるときは、選び方を見直す。
