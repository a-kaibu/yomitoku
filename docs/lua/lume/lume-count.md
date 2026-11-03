---
title: 要素を数える、条件付きの count
description: Lua の小さなユーティリティ集 lume の count。条件関数があれば合う要素を数え、無ければ全体の数を返します。配列なら長さの演算子をそのまま使う、速さへの配慮があります。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [395, 410]
format: 2
function: lume.count
difficulty: 1
tags: [イディオム, イテレータ, 最適化]
---
## ひとことで

`lume.count(t, fn)` は、表 `t` の中の要素の数を返す関数です。`fn` を渡すと、その条件に合う要素だけを数えます。`fn` を渡さないと、全体の数を返します。配列なら `#t` を使って素早く答えるので、同じ名前の関数でも、中身の形に合わせて速さを変えています。

## コード

```lua:line-numbers=395
function lume.count(t, fn)
  local count = 0
  local iter = getiter(t)
  if fn then
    fn = iteratee(fn)
    for _, v in iter(t) do
      if fn(v) then count = count + 1 end
    end
  else
    if lume.isarray(t) then
      return #t
    end
    for _ in iter(t) do count = count + 1 end
  end
  return count
end
```

## 前提知識

- **`fn` を省略できる引数**: Lua では、引数を省くと `nil` になります。`if fn then` で「渡されたか」を確かめるのは、よくある書き方です。
- **`iter(t)` と `getiter`**: lume は、表の種類に応じて、要素を回す関数を選びます。配列でもハッシュ表でも、同じ `for` の形で回せるようにするためのものです。
- **`#t`**: 配列の長さを返す演算子です。配列の要素が途切れなく並んでいれば、要素の数と同じになります。
- **`lume.isarray`**: 表が配列かどうかを判定する lume の関数です。

## 何をしているか

### 1. 条件がなければ、そのまま数える

```lua:line-numbers=403
  else
    if lume.isarray(t) then
      return #t
    end
    for _ in iter(t) do count = count + 1 end
```

`fn` が `nil` のときは、`else` の側に進みます。表が配列なら `#t` で長さを返し、配列でなければ `for _ in iter(t)` で一つずつ数えます。

### 2. 条件があれば、合うものだけを数える

```lua:line-numbers=398
  if fn then
    fn = iteratee(fn)
    for _, v in iter(t) do
      if fn(v) then count = count + 1 end
```

`fn` があるときは、まず `iteratee(fn)` で条件を関数の形に整えます。そして、`fn(v)` が真になった要素だけ `count` を 1 増やします。

## ここがすごい

- **同じ名前で、場合に応じた速さ**: 配列の全体数だけは、回さずに `#t` で答えます。大きな配列でも、数えるための繰り返しが要りません。
- **条件の形を柔軟に**: `iteratee` を通すので、関数でも、値や関数の指定でも、同じ `fn` の場所に渡せます。
- **注意点**: 配列の判定は表の形だけで決まります。途中に `nil` がある配列では、`#t` が想定と違う数を返すことがあります。

## まとめ

- 条件の有無で処理を分けると、一つの関数で、速い場合と汎用の場合の両方に対応できる。
- 配列なら長さの演算子を使うと、回さずに数えられる。
- 条件を整える関数を一か所に通すと、呼び出し側の書き方が自由になる。
