---
title: 四捨五入を、丸める幅を指定してできる round
description: Lua のユーティリティ集 lume の round。小数点以下を四捨五入します。増分を渡すと、その幅の倍数に丸めます。負の数にも対応する符号の扱いが特徴です。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [87, 90]
format: 2
function: lume.round
difficulty: 2
tags: [数値計算, 再帰, 可読性]
---
## ひとことで

`lume.round(x, increment)` は、数 `x` を四捨五入する関数です。`increment` を省くと、整数に丸めます。`increment` を渡すと、その幅の倍数に丸めます。たとえば `lume.round(13, 5)` は `15` になります。Lua の標準には、この形の四捨五入がないので、よく使う丸め方をまとめた関数です。

## コード

```lua:line-numbers=87
function lume.round(x, increment)
  if increment then return lume.round(x / increment) * increment end
  return x >= 0 and math_floor(x + .5) or math_ceil(x - .5)
end
```

## 前提知識

- **`math.floor` と `math.ceil`**: `floor` は小さいほうの整数、`ceil` は大きいほうの整数を返します。ここでは、これを使って切り捨てと切り上げを選びます。
- **`and` と `or` の式**: `条件 and A or B` は、条件が真なら `A`、偽なら `B` を返す書き方です。ただし `A` が偽の値になる場合は使えないので、注意が必要です。
- **再帰呼び出し**: 関数が自分自身を呼ぶことです。ここでは、増分で割った値を丸める、という形で再び `round` を使います。
- **倍数に丸める考え方**: `x` を `increment` で割って整数に丸め、その結果に `increment` を掛け直すと、倍数に丸められます。

## 何をしているか

### 1. 増分があれば、割って丸め、掛け直す

`increment` が渡されたときは、`x / increment` を再帰的に丸めて、最後に `increment` を掛けます。増分を外に出して考えるので、整数に丸める処理だけで済みます。

```lua:line-numbers=88
  if increment then return lume.round(x / increment) * increment end
```

### 2. 整数への四捨五入

`x >= 0` のときは `floor(x + .5)`、負のときは `ceil(x - .5)` を使います。0.5 を足すか引くかを符号で変えることで、負の数も「0 から遠いほう」へ丸められます。

```lua:line-numbers=89
  return x >= 0 and math_floor(x + .5) or math_ceil(x - .5)
```

## ここがすごい

- **1 つの関数で二つの丸め方**: 増分の有無で、整数への丸めと、幅の倍数への丸めを切り替えます。引数が 1 つ増えるだけで機能が広がります。
- **符号を考えた丸め**: `x + .5` だけだと、負の数の 0.5 は、ずれてしまいます。符号で式を分けるので、正と負のどちらも、四捨五入の直感どおりになります。
- **短く読める**: 2 行の中で、倍数の処理と符号の扱いが収まっています。
- **注意点**: 小数の誤差があるので、ちょうど 0.5 の値は、浮動小数点の表現によって思わぬ結果になることがあります。また、`increment` に 0 を渡すと、割り算でおかしくなります。

## まとめ

- 増分を外に出すと、幅の倍数への丸めを、整数への丸めに帰着できる。
- 負の数の四捨五入は、符号で式を分けると正しく扱える。
- 浮動小数点の誤差と、増分が 0 の場合は、使う前に確かめておく。
