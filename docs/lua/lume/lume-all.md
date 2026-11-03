---
title: すべての値が条件を満たすかを、表や関数で調べる all
description: Lua の小さなユーティリティ集 lume の all。表の値を 1 つずつ調べ、条件に合わない値が見つかった時点で false を返します。条件には関数や、値の一致の指定を使えます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [268, 275]
format: 2
function: lume.all
difficulty: 1
tags: [イテレータ, 関数型, 設計パターン]
---

## ひとことで

`lume.all(t, fn)` は、表 `t` のすべての値が条件 `fn` を満たすかを調べる関数です。途中で 1 つでも満たさない値があれば、そこで `false` を返します。全部満たせば `true` を返します。条件には、関数だけでなく、表の一部の値を指定する書き方も使えます。

## コード

```lua:line-numbers=268
function lume.all(t, fn)
  fn = iteratee(fn)
  local iter = getiter(t)
  for _, v in iter(t) do
    if not fn(v) then return false end
  end
  return true
end
```

条件の変換を行う `iteratee` も、読むのに必要なので引用します。

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

- **`iteratee`**: 渡された値を、条件の関数に変える内部関数です。関数はそのまま、表は「この値を含むか」の関数、それ以外は「その名前の項目を取り出す」関数になります。
- **`getiter`**: 表が配列なら `ipairs`、そうでなければ `pairs` を返す内部関数です。
- **早期の終了**: 答えが決まった時点で、残りを調べずに止めることです。

## 何をしているか

### 1. 条件を関数に直す

`iteratee(fn)` で、渡された条件を、値を受け取って真偽を返す関数に変えます。

```lua:line-numbers=269
  fn = iteratee(fn)
```

### 2. 偽が見つかったら止める

値を 1 つずつ条件に当てて、満たさないものが見つかれば、すぐに `false` を返します。

```lua:line-numbers=272
    if not fn(v) then return false end
```

### 3. 最後まで満たせば true

すべての値を通ったら、`true` を返します。空の表でも `true` になります。

## ここがすごい

- **条件の書き方が広い**: 関数、表による一致、キーの名前のどれでも、同じ `fn` の引数で渡せます。
- **早く止まる**: 1 つでも条件を満たさなければ、残りを調べません。
- **注意点**: 空の表は `true` を返します。「空なら偽」を期待すると、思わぬ結果になります。

## まとめ

- すべてが満たすかを調べるときは、偽が見つかった時点で止めると速い。
- 条件の書き方を、関数や表で柔軟に受け付けると呼ぶ側が楽になる。
