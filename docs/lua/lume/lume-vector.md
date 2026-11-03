---
title: 角度と長さから、二次元のベクトルを作る vector
description: Lua のユーティリティ集 lume の vector。角度と長さを受け取り、x と y の成分を返します。三角関数で、極座標から直交座標へ変換します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [128, 130]
format: 2
function: lume.vector
difficulty: 1
tags: [数値計算, 可読性, イディオム]
---
## ひとことで

`lume.vector(angle, magnitude)` は、角度 `angle`（ラジアン）と長さ `magnitude` から、二次元のベクトルの x 成分と y 成分を返す関数です。ゲームの移動や、弾の発射方向などを、角度で表したいときに使えます。

## コード

```lua:line-numbers=128
function lume.vector(angle, magnitude)
  return math.cos(angle) * magnitude, math.sin(angle) * magnitude
end
```

## 前提知識

- **ラジアン**: 角度を、円周の長さを使って表す単位です。一周は `2π` ラジアンです。`math.cos` と `math.sin` は、この単位で角度を受け取ります。
- **`math.cos` と `math.sin`**: 角度に対する、余弦と正弦を返す関数です。単位円の上の点の x 座標と y 座標に対応します。
- **極座標と直交座標**: 長さと角度で表す方法を極座標、x と y で表す方法を直交座標と呼びます。この関数は、前者を後者に変換します。
- **複数の戻り値**: Lua の関数は、カンマで区切って二つの値を返せます。ここでは x と y の両方を返しています。

## 何をしているか

### 1. x 成分を、長さと余弦から求める

角度の余弦に長さを掛けると、x 方向の成分になります。長さが大きいほど、同じ角度でも x は大きくなります。

```lua:line-numbers=129
  return math.cos(angle) * magnitude, math.sin(angle) * magnitude
```

### 2. y 成分は、長さと正弦から求める

角度の正弦に長さを掛けると、y 方向の成分になります。x と y を、同じ長さと角度から組み立てています。

```lua:line-numbers=129
  return math.cos(angle) * magnitude, math.sin(angle) * magnitude
```

## ここがすごい

- **角度を扱いやすくする**: 方向と速さを、そのまま一組の成分にできます。移動の計算は、x と y を足すだけで済みます。
- **二つの値を一度に返す**: 関数の中で、x と y の両方を計算し、一度に返します。呼ぶ側は、二つの変数に受け取るだけでよいです。
- **短い式**: 一行に、余弦と正弦の両方が書かれています。計算の意味が、式を見てすぐ分かります。
- **注意点**: 角度はラジアンで渡す必要があります。度数で渡すと、結果が思っていたものと違います。

## まとめ

- 方向と速さで表した動きは、余弦と正弦で成分に変換すると、足し算で扱える。
- 関数が二つの値を返すと、一度の呼び出しで両方の成分を受け取れる。
- 角度の単位を、ラジアンで統一しておくと、計算の誤りを防げる。
