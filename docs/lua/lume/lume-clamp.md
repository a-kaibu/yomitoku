---
title: 範囲の中に値を収める clamp と、三項の連なり
description: Lua のユーティリティ集 lume の clamp。値を最小値と最大値の間に収めます。範囲より小さければ最小値を、大きければ最大値を返します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [82, 84]
format: 2
function: lume.clamp
difficulty: 1
tags: [数値計算, イディオム, 可読性]
---
## ひとことで

`lume.clamp(x, min, max)` は、値 `x` を `min` と `max` の範囲に収める関数です。`x` が `min` より小さければ `min` を、`max` より大きければ `max` を返します。範囲の中なら、`x` をそのまま返します。ゲームの体力や音量など、上限と下限のある値に使われます。

## コード

```lua:line-numbers=82
function lume.clamp(x, min, max)
  return x < min and min or (x > max and max or x)
end
```

## 前提知識

- **`and` と `or` による条件式**: `条件 and A or B` は、条件が真なら `A`、偽なら `B` を返す書き方です。ただし `A` が `false` や `nil` のときは、期待どおりになりません。
- **入れ子の条件**: `x > max and max or x` は、「`x` が `max` より大きければ `max`、そうでなければ `x`」を表します。その外側に `x < min and min or ...` を重ねています。
- **比較演算子**: `<` や `>` で、数の大小を比べます。
- **範囲の表現**: 下限と上限を決めることを、クランプ（clamp）と呼びます。値を範囲の内側に押し込むという意味です。

## 何をしているか

### 1. 下限より小さければ、下限を返す

```lua:line-numbers=83
  return x < min and min or (x > max and max or x)
```

`x < min` が真なら、`min` を返します。外側の `and or` の一つ目の部分です。

### 2. 上限より大きければ上限、それ以外は値そのもの

```lua:line-numbers=83
  return x < min and min or (x > max and max or x)
```

`x > max` が真なら `max` を返し、偽なら `x` を返します。これが、`or` の後ろにある内側の式です。全体は、下限の判定の結果を次の式に渡す形になっています。

## ここがすごい

- **一行で範囲を決める**: 関数の中で、`if` を二つ書く代わりに、一つの式で三つの場合を表しています。
- **値を変えるだけ**: 元の値を書き換えず、戻り値として範囲内の値を返します。呼ぶ側は、結果を変数に受け取れます。
- **上下の両方に対応**: 下限と上限が、どちらも一つの関数で扱えます。片方だけを使いたいときは、もう片方を大きな値にすれば済みます。
- **注意点**: `min` が `max` より大きいと、結果は思わぬ値になります。また、`and` と `or` の式は、`min` や `max` が `false` のときには使えません。

## まとめ

- 値を範囲に収める処理は、条件の式を組み合わせると、一行で表せる。
- `and` と `or` の式は、真になる値が `false` や `nil` にならないことを確かめて使う。
- 範囲の指定が正しいかを、呼ぶ前に確かめておくと、思わぬ結果を防げる。
