---
title: 引数を比較の関数に変える iteratee
description: Lua のユーティリティ集 lume の iteratee。関数、表、鍵の三種類の指定を、同じ形の判定関数に変えます。map や filter などが、どの指定でも使えるようにする仕組みです。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [66, 78]
format: 2
function: iteratee
difficulty: 3
tags: [関数型, 設計パターン, イディオム]
---
## ひとことで

`iteratee(x)` は、利用者が渡した「条件の指定」を、常に関数の形にそろえる内部の関数です。`x` が関数ならそのまま使い、表なら値の一致を調べる関数に、鍵の名前や値なら取り出して比べる関数に変えます。`lume.map` や `lume.filter` などが、どの書き方でも同じように扱える土台です。

## コード

```lua:line-numbers=66
local iteratee = function(x)
  if x == nil then return identity end
  if iscallable(x) then return x end
  if type(x) == "table" then
    return function(z)
      for k, v in pairs(x) do
        if z[k] ~= v then return false end
      end
      return true
    end
  end
  return function(z) return z[x] end
end
```

## 前提知識

- **関数は値**: Lua では、関数も変数に入れたり、引数で渡したりできます。`iteratee` は、その性質を使って、指定の形を変換します。
- **`iscallable`**: 値が関数として呼べるかを調べる lume の内部の関数です。関数や、関数を持つ表を見分けます。
- **`identity`**: 渡された値をそのまま返す関数です。指定がないときに、何もしない判定として使われます。
- **表による判定**: 表を条件にすると、その表のすべての鍵と値が一致するかを調べます。部分一致の検索に似た働きです。

## 何をしているか

### 1. 指定がなければ、そのまま通す

`x` が `nil` なら、`identity` を返します。指定がないときは、値そのものを条件として使います。

```lua:line-numbers=67
  if x == nil then return identity end
```

### 2. 関数ならそのまま使う

`x` が呼び出せる値なら、そのまま返します。利用者が書いた判定関数は、変換せずに使われます。

```lua:line-numbers=68
  if iscallable(x) then return x end
```

### 3. 表なら、すべての鍵と値を比べる

`x` が表なら、その中の鍵と値を一つずつ、判定の対象と比べます。一つでも違えば `false`、すべて一致すれば `true` を返します。

```lua:line-numbers=69
  if type(x) == "table" then
    return function(z)
      for k, v in pairs(x) do
        if z[k] ~= v then return false end
      end
      return true
    end
```

### 4. それ以外は、鍵で取り出す

関数でも表でもなければ、`x` を鍵として値を取り出す関数を返します。たとえば「名前」という鍵を渡せば、各要素の名前を取り出せます。

```lua:line-numbers=76
  end
  return function(z) return z[x] end
```

## ここがすごい

- **三種類の指定を一つにまとめる**: 関数、表、鍵のどれを渡しても、後の処理は同じ形の関数を呼ぶだけです。
- **呼ぶ側が書きやすい**: 短い指定なら、関数を書かずに、表や鍵の名前だけで済みます。
- **変換が一か所**: 指定の解釈をこの関数に集めているので、新しい形の指定を足すときも、ここを直せば済みます。
- **注意点**: 表による判定は、値の比べ方が `==` なので、入れ子の表の中身までは比べられません。深い比較が必要なときは、関数を渡してください。

## まとめ

- 利用者の指定の形が複数あるときは、内部で関数にそろえると、後の処理を一つの形で書ける。
- 指定の解釈を一か所にまとめると、使い方を増やしても影響範囲が小さい。
- 比べ方の限界（入れ子の値など）は、指定の形ごとに利用者へ伝えておく。
