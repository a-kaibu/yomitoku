---
title: 数なら個数、関数なら条件で先頭を取る take
description: LuaJIT 向け関数型ライブラリ Lua Fun の take。第一引数が数なら take_n、関数なら take_while へ振り分けます。一つの名前で二つの取り方を選べる、利便性の高い入口です。
language: lua
project: Lua Fun
repo: https://github.com/luafun/luafun
license: MIT
copyright: Copyright (c) 2013-2017 Roman Tsisyk
commit: "057ede73d78b0e6bdbb354b35492d28c7950f857"
file: fun.lua
lines: [402, 410]
format: 2
function: take
difficulty: 1
tags: [イディオム, 関数型, 可読性]
---
## ひとことで

`take(n_or_fun, gen, param, state)` は、列の先頭から値を取り出す関数です。第一引数が数なら個数で取り、関数なら、その条件が真の間だけ取ります。どちらで取るかは、引数の型で自動的に決まります。利用者は、`take` という一つの名前だけを覚えれば済みます。

## コード

```lua:line-numbers=402
local take = function(n_or_fun, gen, param, state)
    if type(n_or_fun) == "number" then
        return take_n(n_or_fun, gen, param, state)
    else
        return take_while(n_or_fun, gen, param, state)
    end
end
methods.take = method1(take)
exports.take = export1(take)
```

## 前提知識

- **`take_n` と `take_while`**: 個数で取る `take_n`、条件で取る `take_while` の二つの関数です。`take` は、この二つへの振り分けを担当します。
- **`type(n_or_fun) == "number"`**: 引数が数かを調べる判定です。数なら、個数の取り方を選びます。
- **`n_or_fun` という名前**: 「数か関数のどちらか」を表す名前です。引数の型が二通りあることを、名前で示しています。
- **`method1` と `export1`**: 同じ `take` を、メソッドと公開の関数として使えるようにする、二つの包み方です。

## 何をしているか

### 1. 引数が数かどうかを確かめる

`type(n_or_fun) == "number"` で、個数の指定かどうかを調べます。

```lua:line-numbers=403
    if type(n_or_fun) == "number" then
```

### 2. 数なら個数で、そうでなければ条件で取る

数なら `take_n` に、それ以外なら `take_while` に、同じ列の材料を渡します。結果は、そのまま返されます。

```lua:line-numbers=404
        return take_n(n_or_fun, gen, param, state)
    else
        return take_while(n_or_fun, gen, param, state)
```

## ここがすごい

- **名前が一つで済む**: 個数と条件を、同じ関数名で使い分けられます。覚えることが少なくて済みます。
- **振り分けが一か所**: どちらの取り方を使うかの判定を、この関数だけに置いています。新しい取り方を足すときも、ここを直せば済みます。
- **中身は既存の関数に任せる**: 実際の取り方は、`take_n` と `take_while` が担当します。重複したコードを書かずに済みます。
- **注意点**: 引数が数でも関数でもない値を渡すと、`take_while` 側でエラーになります。型を間違えないように注意してください。

## まとめ

- 同じ目的で二通りの指定があるときは、引数の型で振り分けると、名前を一つにまとめられる。
- 振り分けの処理は一か所に置くと、取り方を増やしても影響が小さい。
- 引数の型が二通りあることは、名前で示すと読み手に伝わりやすい。
