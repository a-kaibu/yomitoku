---
title: 跳ねを逆向きにして、inBounce を一行で作る
description: Lua のアニメーションライブラリ kikito/tween.lua の inBounce。outBounce の時間を逆にして差を取るだけで、落ちる前の跳ねの動きを表します。
language: lua
project: tween.lua
repo: https://github.com/kikito/tween.lua
license: MIT
copyright: Copyright (c) 2014 Enrique García Cota, Yuichi Tateno, Emmanuel Oga
commit: "9cdcd39339ec9e8b9c1a08e65aa0a8f2aab62172"
file: tween.lua
lines: [220, 220]
format: 2
function: inBounce
difficulty: 2
tags: [数値計算, 再帰, 可読性]
---
## ひとことで

`inBounce(t, b, c, d)` は、跳ねながら最後に一気に止まる、いわゆる「跳ねて入る」動きを表す関数です。新しい式を一から書かず、`outBounce` を時間の向きを逆にして使い、その結果を全体から引くだけで作られています。一行で書けるのは、この対称な性質があるからです。

## コード

```lua:line-numbers=220
local function inBounce(t, b, c, d) return c - outBounce(d - t, 0, c, d) + b end
```

## 前提知識

- **`outBounce`**: 跳ねて止まる動きを表す関数です。時間 `0` で始まり、時間 `d` で終わります。
- **時間の反転 `d - t`**: 時間を逆向きに数える計算です。終わりから始まりへ向かう動きを、始まりから終わりの見え方に変えます。
- **値の反転 `c - ...`**: 変化量 `c` から、値を引く計算です。動きの向きを逆にしたとき、値の大きさを正しい位置に戻します。
- **イージングの対称性**: 「出る動き」と「入る動き」は、時間と値を反転させると、互いに写し合う関係になります。

## 何をしているか

### 1. 時間を逆向きにして、outBounce に渡す

`d - t` で時間を逆にし、`outBounce` に渡します。終わりのほうから跳ねを数えることになります。

```lua:line-numbers=220
local function inBounce(t, b, c, d) return c - outBounce(d - t, 0, c, d) + b end
```

### 2. 結果を全体から引いて、値を戻す

`outBounce` の結果を `c` から引き、`b` を足します。跳ねの高さが、入る方向の動きとして表されます。

## ここがすごい

- **一行で書ける**: 新しい区間の式をいくつも書く必要がありません。既にある `outBounce` を、組み替えるだけで済みます。
- **対称性を利用**: 出る動きと入る動きは、互いに鏡のような関係です。その関係を式で直接使うと、コードが短くなります。
- **保守しやすい**: 跳ねの形を変えたいときは、`outBounce` を直すだけで、`inBounce` も自動的に変わります。
- **注意点**: 対称性を前提にしているので、`outBounce` の意味を変えると、`inBounce` の動きも変わります。二つの関数は、一緒に確かめる必要があります。

## まとめ

- 逆向きの動きは、既にある動きを時間と値の両方で反転させると、新しく式を書かずに作れる。
- 対称な関係があるなら、それを式に直接使うと、コードが短く保てる。
- 一つの関数を変えたとき、関連する関数が連動することを意識しておく。
