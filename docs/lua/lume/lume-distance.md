---
title: 二点間の距離を、平方根を省いても求められる
description: Lua のユーティリティ集 lume の distance。二つの点の距離を求めます。平方根を省いた二乗の距離も選べるので、比べるだけの処理を速くできます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [115, 120]
format: 2
function: lume.distance
difficulty: 2
tags: [数値計算, 最適化, 可読性]
---
## ひとことで

`lume.distance(x1, y1, x2, y2, squared)` は、平面上の二つの点 `(x1, y1)` と `(x2, y2)` の距離を返す関数です。`squared` に真を渡すと、平方根を取らない二乗の距離を返します。距離の大小を比べるだけなら、二乗のほうで十分なので、計算を省けます。

## コード

```lua:line-numbers=115
function lume.distance(x1, y1, x2, y2, squared)
  local dx = x1 - x2
  local dy = y1 - y2
  local s = dx * dx + dy * dy
  return squared and s or math_sqrt(s)
end
```

## 前提知識

- **三平方の定理**: 直角三角形で、斜辺の二乗は他の二辺の二乗の和に等しい、という関係です。二点間の距離は、x の差と y の差から、この関係で求められます。
- **平方根（`sqrt`）**: 二乗の数から、もとの数を求める計算です。計算が重い操作なので、省けるときは省くと速くなります。
- **大小の比較**: 距離 `d` と `e` の大小は、二乗した `d*d` と `e*e` の大小と同じです。距離は正の数なので、この関係が成り立ちます。
- **`and` と `or`**: `squared and s or math_sqrt(s)` は、条件に応じて二つの値のどちらかを選ぶ書き方です。

## 何をしているか

### 1. x と y の差から、二乗の和を作る

まず x の差と y の差を求め、それぞれを二乗して足します。この値が、距離の二乗にあたります。

```lua:line-numbers=116
  local dx = x1 - x2
  local dy = y1 - y2
  local s = dx * dx + dy * dy
```

### 2. 二乗のままか、平方根を取るか選ぶ

`squared` が真なら、二乗の和 `s` をそのまま返します。偽なら、`math_sqrt(s)` で平方根を取って距離を返します。

```lua:line-numbers=119
  return squared and s or math_sqrt(s)
```

## ここがすごい

- **平方根を省ける**: 近いか遠いかを比べるだけの処理では、二乗の値で十分です。平方根の計算を毎回省けます。
- **一つの関数で二つの用途**: 距離そのものが欲しいときと、比較だけしたいときを、引数の 1 つで切り替えられます。
- **符号を気にしない**: 差を二乗するので、x の引き算の順番を入れ替えても、結果は同じです。
- **注意点**: `squared` が真のときの戻り値は、距離そのものではありません。表示や、実際の長さとして使う場合は、必ず偽で呼んでください。

## まとめ

- 距離の大小だけが必要なら、平方根を省いた二乗の値で比べると、計算が速い。
- 二乗の和を先に作り、必要なときだけ平方根を取ると、処理が分かりやすくなる。
- 戻り値が二乗かどうかは、呼ぶ側が必ず意識する必要がある。
