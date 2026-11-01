---
title: "0 から 1 の割合で灰色を作る gray"
description: "白の割合を 0 から 1 で指定して灰色の文字色を作る gray。範囲外の値は require で止め、赤緑青に同じ値を入れて RGB の色にする。"
language: kotlin
project: "Mordant"
repo: https://github.com/ajalt/mordant
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "2c588d7ccece0ea5c117f5174b18fd85cb017d74"
file: mordant/src/commonMain/kotlin/com/github/ajalt/mordant/rendering/TextColors.kt
lines: [201, 204]
function: "TextColors.Companion.gray"
difficulty: 1
tags: [イディオム, 防御的プログラミング, 関数型]
format: 2
---

## ひとことで

`gray()` は、白の割合を **0 から 1 の数字** で指定して、灰色の文字色を作る関数です。0 は真っ黒、1 は真っ白です。0.5 なら、ちょうど中間の灰色になります。

Mordant（ターミナルに色を付けるライブラリ）で、文字の色を決める一つの方法として使えます。

## コード

```kotlin:line-numbers=201
        fun gray(fraction: Number, level: AnsiLevel = TRUECOLOR): TextStyle {
            require(fraction.toFloat() in 0f..1f) { "fraction must be in the range [0, 1]" }
            return rgb(fraction, fraction, fraction, level)
        }
```

## 前提知識

- **RGB（赤・緑・青）**: 色を、赤、緑、青の明るさの組み合わせで表す方法です。3 つの値が同じなら、その明るさの灰色になります。
- **`TextStyle`**: 文字の見た目（色や太字など）をまとめた型です。`gray()` は、この型の値を返します。
- **`Number`**: 整数や小数などの数値の共通の型です。`fraction` には、`0.5` のような小数も `1` のような整数も渡せます。
- **`require`**: 条件が満たされないときに例外で止める関数です。ここでは範囲の確認に使っています。
- **`level` の既定値 `TRUECOLOR`**: 色の表し方の段階の一つで、フルカラーを表します。省略すると、この値になります。

## 何をしているか

### 1. 範囲を確かめる

```kotlin:line-numbers=202
            require(fraction.toFloat() in 0f..1f) { "fraction must be in the range [0, 1]" }
```

渡された値を小数に直して、0 以上 1 以下かを確かめます。範囲の外なら、例外で止めます。たとえば `1.5` を渡すと、白より明るい色は作れないので、ここで気づけます。

### 2. 3 つの成分に同じ値を入れる

```kotlin:line-numbers=203
            return rgb(fraction, fraction, fraction, level)
```

赤、緑、青の 3 つに、同じ割合を入れて `rgb()` に渡します。3 つが同じ明るさなら、色は必ず灰色になります。

## ここがすごい

- **本体が 1 行で済む**: 灰色は、赤緑青が同じ値の RGB だという性質をそのまま使っています。専用の計算式を書かずに済んでいます。
- **範囲の確認を入り口で行う**: 0 から 1 の外の値を、色を作る前に止めています。中で変な色が作られることがありません。
- **`Number` を受け取る**: 整数でも小数でも渡せるので、呼び出し側は型を変換せずに済みます。確認の場所で `toFloat()` に直して比べています。
- **同じ形の関数が並ぶ**: 同じファイルには `rgb`、`hsl`、`hsv` などがあります。`gray` はその中で最も単純な例なので、他の関数の入口として読むのに向いています。

## まとめ

- `gray()` は、0 から 1 の割合を、赤緑青に同じ値を入れた RGB の灰色に変える。
- 範囲の外の値は `require` で止めて、おかしな色を作らない。
- 最も単純な色の作り方なので、他の色の関数を読む前の入口として役立つ。
