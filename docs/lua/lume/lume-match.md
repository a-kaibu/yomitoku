---
title: 条件に合う最初の要素と、その位置を返す
description: Lua のユーティリティ集 lume の match。表を先頭から調べて、条件に合う最初の値とそのキーを返します。見つからなければ nil を返します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [385, 392]
format: 2
function: lume.match
difficulty: 1
tags: [イテレータ, 関数型, 探索]
---
## ひとことで

`lume.match(t, fn)` は、表 `t` の中から条件 `fn` に最初に合う値を探す関数です。見つけたら、その値とキーの 2 つを返します。見つからなければ `nil` を返します。配列でも連想配列でも、同じ書き方で探せます。

## コード

```lua:line-numbers=385
function lume.match(t, fn)
  fn = iteratee(fn)
  local iter = getiter(t)
  for k, v in iter(t) do
    if fn(v) then return v, k end
  end
  return nil
end
```

## 前提知識

- **複数の戻り値**: Lua の関数は、カンマで区切って複数の値を返せます。`return v, k` は、値とキーの 2 つを返します。
- **`for k, v in iter(t)`**: 表のキーと値を順に回す書き方です。`iter` は、表の種類に応じて lume が選ぶ関数です。
- **`iteratee`**: 条件を、関数として扱える形に整える lume の関数です。
- **`return` による途中終了**: `return` が実行されると、関数はその場で終わります。ここでは、見つけた時点で探すのをやめる働きをします。

## 何をしているか

### 1. 条件と、回す方法を用意する

`fn` を `iteratee` で関数の形に整え、表を回すための `iter` を取り出します。

```lua:line-numbers=386
  fn = iteratee(fn)
  local iter = getiter(t)
```

### 2. 条件に合う値があれば、すぐに返す

表の要素を一つずつ調べ、`fn(v)` が真になったら、値 `v` とキー `k` を返します。ここで関数が終わるので、残りの要素は調べません。

```lua:line-numbers=388
  for k, v in iter(t) do
    if fn(v) then return v, k end
```

### 3. 一つも合わなければ nil

最後まで調べて見つからなければ、`nil` を返します。

```lua:line-numbers=391
  return nil
```

## ここがすごい

- **途中で止まる**: 最初に合う要素を見つけた時点で `return` するので、大きな表でも、必要な分だけを調べます。
- **値とキーを一緒に返す**: 値だけでなく、どこにあったかのキーも返すので、後で同じ位置を書き換えるような処理にも使えます。
- **表の種類を気にしない**: 配列でもハッシュ表でも、`iter` が回し方を決めてくれます。呼び出し側は、表の形を意識しなくてよいです。
- **注意点**: 値が `nil` の場合は、見つかったとは扱われません。また、`false` が合格の値になるときは、戻り値の判定に注意してください。

## まとめ

- 条件に合う最初の要素を探すときは、見つけた時点で `return` すると、無駄な繰り返しを避けられる。
- 値とキーを一緒に返すと、呼び出し側が位置も使える。
- 見つからない場合の戻り値を決めておくと、呼び出し側の判定が簡単になる。
