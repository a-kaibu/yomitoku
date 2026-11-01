---
title: "Long を Int の範囲に丸める clampToInt"
description: "Long の値が Int に収まらないとき、最大値か最小値に丸めて変換する関数。範囲内ならそのまま Int にする。超過で値が折り返されるのを防ぐ。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "\"Copyright 2019-2020 JetBrains s.r.o.\""
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/common/src/internal/math.kt
lines: [11, 16]
function: "Long.clampToInt"
difficulty: 1
tags: [型システム, 数値計算, 防御的プログラミング]
format: 2
---

## ひとことで

`Long`（64 ビット整数）を `Int`（32 ビット整数）に変換すると、範囲を超えた値は **上位のビットが捨てられて**、まったく違う値に折り返されてしまいます。

`clampToInt` は、その変換を安全にする関数です。範囲を超えたら **最大値 `Int.MAX_VALUE` か最小値 `Int.MIN_VALUE` に丸め** 、範囲内なら普通に `Int` へ変換します。

## コード

```kotlin:line-numbers=11
internal fun Long.clampToInt(): Int =
        when {
            this > Int.MAX_VALUE -> Int.MAX_VALUE
            this < Int.MIN_VALUE -> Int.MIN_VALUE
            else -> toInt()
        }
```

## 前提知識

- **`Int` と `Long` の範囲**: `Int` は約 ±21 億（`Int.MAX_VALUE` は 2147483647）、`Long` はさらに大きな範囲です。
- **`toInt()`**: `Long` を `Int` に変換する関数です。範囲を超えると、下位 32 ビットだけが残るため、値が変わってしまいます。
- **`when` 式**: 条件を上から順に調べて、最初に当てはまった値を返す式です。
- **`clamp`（クランプ）**: 値を、決めた範囲の中に押し込むことです。範囲より大きければ上限、小さければ下限にします。

## 何をしているか

### 1. 上限を超えたら、最大値にする

```kotlin:line-numbers=13
            this > Int.MAX_VALUE -> Int.MAX_VALUE
```

`Int` の上限より大きければ、`Int.MAX_VALUE` を返します。

### 2. 下限を下回ったら、最小値にする

```kotlin:line-numbers=14
            this < Int.MIN_VALUE -> Int.MIN_VALUE
```

`Int` の下限より小さければ、`Int.MIN_VALUE` を返します。

### 3. 範囲内なら、そのまま変換する

```kotlin:line-numbers=15
            else -> toInt()
```

範囲に収まっていれば、普通に `toInt()` で変換します。この場合は値が変わりません。

## ここがすごい

- **折り返しを防ぐ**: 単に `toInt()` すると、大きな値が思いがけない小さな値になります。上限と下限で丸めれば、どんな `Long` でも、符号の正しい `Int` になります。
- **条件を並べるだけ**: `when` の 3 つの分岐で、すべての場合を書き切っています。新しい場合の分け方を考える必要がありません。
- **意味が名前で伝わる**: `clamp`（押し込む）という名前から、範囲を超えた値を端に寄せる処理だと分かります。
- **使う前に丸める**: 大きな値を `Int` の引数で受ける処理に渡す前に、この関数で丸めれば、折り返しによる誤りを防げます。

## まとめ

- 大きな整数を小さな型に変換するときは、範囲外の値を端に丸める。
- `when` で範囲の場合分けを書くと、すべての場合を一目で確かめられる。
- 丸めの関数を 1 つにまとめると、変換の安全性を同じ方法で保てる。
