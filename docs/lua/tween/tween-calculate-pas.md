---
title: 周期と振幅を、既定値つきで求める calculatePAS
description: Lua のアニメーションライブラリ kikito/tween.lua の calculatePAS。弾むような動きで使う、周期 p、振幅 a、位相の補正 s を、与えられた引数から決めます。省略された値には既定値を使います。
language: lua
project: tween.lua
repo: https://github.com/kikito/tween.lua
license: MIT
copyright: Copyright (c) 2014 Enrique García Cota, Yuichi Tateno, Emmanuel Oga
commit: "9cdcd39339ec9e8b9c1a08e65aa0a8f2aab62172"
file: tween.lua
lines: [146, 150]
format: 2
function: calculatePAS
difficulty: 3
tags: [数値計算, イディオム, 防御的プログラミング]
---
## ひとことで

`calculatePAS(p, a, c, d)` は、弾むような動きのイージングで使う三つの値、周期 `p`、振幅 `a`、位相の補正 `s` を決める関数です。省略された `p` と `a` には既定値を使います。振幅が変化量より小さいときと、大きいときで、位相の求め方を分けています。

## コード

:::: code-group

```lua:line-numbers=146 [日本語訳]
local function calculatePAS(p,a,c,d)
  p, a = p or d * 0.3, a or 0
  if a < abs(c) then return p, c, p / 4 end -- p、a、s の値
  return p, a, p / (2 * pi) * asin(c/a) -- p,a,s
end
```

```lua:line-numbers=146 [原文]
local function calculatePAS(p,a,c,d)
  p, a = p or d * 0.3, a or 0
  if a < abs(c) then return p, c, p / 4 end -- p, a, s
  return p, a, p / (2 * pi) * asin(c/a) -- p,a,s
end
```

::::

## 前提知識

- **周期 `p`**: 振動が一回りする長さです。既定値は、時間 `d` の `0.3` 倍です。
- **振幅 `a`**: 振れ幅の大きさです。変化量 `c` より小さいと、揺れが足りず、位相の計算が成り立ちません。
- **`asin`**: 逆正弦の関数です。`asin(c / a)` は、比から角度を求めます。値の範囲は `-1` から `1` までです。
- **`or` による既定値**: `p or d * 0.3` は、`p` が `nil` のときに、`d * 0.3` を使う書き方です。

## 何をしているか

### 1. 周期と振幅を、既定値で埋める

`p` と `a` が省略されたときは、周期を時間の 0.3 倍、振幅を 0 とします。

```lua:line-numbers=147
  p, a = p or d * 0.3, a or 0
```

### 2. 振幅が変化量より小さいとき

`a` が `abs(c)` より小さいなら、振幅を変化量 `c` に置き換え、位相の補正を `p / 4` とします。振れ幅が足りないときは、変化量に合わせて振幅を決め直します。

```lua:line-numbers=148
  if a < abs(c) then return p, c, p / 4 end -- p, a, s
```

### 3. それ以外は、逆正弦で位相を求める

振幅が十分なら、`asin(c / a)` から位相を求めます。戻り値は、周期、振幅、位相の三つです。

```lua:line-numbers=149
  return p, a, p / (2 * pi) * asin(c/a) -- p,a,s
```

## ここがすごい

- **省略に強い**: 呼び出しの側は、必要な値だけを渡せます。既定値が、適切な動きを自動で作ります。
- **場合分けで安全**: 振幅が小さすぎるときに、`asin` の範囲外の値を渡さないように分けています。計算が壊れるのを防ぎます。
- **三つの値をまとめて返す**: 周期、振幅、位相を一度に返すので、後の計算で必要な組が揃います。
- **注意点**: `asin` の引数は `-1` から `1` の範囲にある必要があります。振幅の扱いを変えると、この前提が崩れることがあります。

## まとめ

- 数式の引数には、既定値を用意すると、呼び出しを簡単にできる。
- 関数の値の範囲が限られるときは、範囲の外になる場合を分けて扱うと、計算が安定する。
- 複数の結果は、一度にまとめて返すと、後の処理で使いやすい。
