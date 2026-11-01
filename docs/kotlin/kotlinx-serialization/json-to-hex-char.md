---
title: "0 から 15 を 16 進数の 1 文字にする toHexChar"
description: "0 から 15 の値を、16 進数の 1 文字（0 から 9 と、小文字の a から f）に変える関数。JSON の \\u のあとに続く 4 桁の表記を作るために使う。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "\"Copyright 2017-2019 JetBrains s.r.o.\""
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: formats/json/commonMain/src/kotlinx/serialization/json/internal/StringOps.kt
lines: [9, 13]
function: "toHexChar"
difficulty: 1
tags: [入出力, 文字列処理, ビット演算]
format: 2
---

## ひとことで

16 進数は、0 から 9 と、A から F（ここでは小文字の a から f）の 16 種類の文字で数を表す方式です。1 桁は 4 ビットに対応します。

`toHexChar` は、**0 から 15 の値を、その 1 桁の文字に変換** します。JSON の文字列で、制御文字を `\u001f` のように書くとき、この変換で 1 桁ずつ文字を作っています。

## コード

```kotlin:line-numbers=9
private fun toHexChar(i: Int) : Char {
    val d = i and 0xf
    return if (d < 10) (d + '0'.code).toChar()
    else (d - 10 + 'a'.code).toChar()
}
```

## 前提知識

- **16 進数**: 1 桁で 0 から 15 を表します。10 から 15 は `a` から `f` で書きます。
- **`and 0xf`**: 下位 4 ビット（0 から 15）だけを取り出す計算です。`0xf` は `1111` です。
- **`'0'.code`**: 文字 `'0'` の番号（48）を取り出します。文字の番号を足すと、その文字になります。
- **`toChar()`**: 番号を文字に変換する関数です。

## 何をしているか

### 1. 下位 4 ビットを取り出す

```kotlin:line-numbers=10
    val d = i and 0xf
```

どんな整数が来ても、下位 4 ビット（0 から 15）だけを使います。16 以上の値は、下位の 1 桁として扱われます。

### 2. 0 から 9 は数字、10 から 15 は文字

```kotlin:line-numbers=11
    return if (d < 10) (d + '0'.code).toChar()
```

0 から 9 の場合は、`'0'` の番号に足して数字の文字にします。たとえば `d = 3` なら、`'0'`（48）に 3 を足して `'3'` になります。

```kotlin:line-numbers=12
    else (d - 10 + 'a'.code).toChar()
```

10 から 15 の場合は、10 を引いた値を `'a'` の番号に足します。`d = 10` なら `'a'`、`d = 15` なら `'f'` です。

### 3. 4 桁の例

制御文字の `0x1f` は、4 桁のうち上の 2 桁が `0` で、3 桁目が `1`、4 桁目が `f` です。それぞれの桁に `toHexChar` をかけて `0`、`0`、`1`、`f` を作り、つなげると `\u001f` の形になります。JSON では、この書き方で制御文字を表します。

## ここがすごい

- **文字の番号の差を使う**: 数字とアルファベットの並びは連続しているので、文字の番号に値を足すだけで文字が作れます。大きな表を用意しなくて済みます。
- **下位 4 ビットに限る**: `and 0xf` によって、範囲外の入力が来ても、必ず 1 桁の 16 進数になります。
- **分岐は 1 回だけ**: 数字とアルファベットの 2 通りで、`if` の 1 回の判定で済みます。
- **JSON の \u に直結**: 4 桁の `\uXXXX` は、この関数を 4 回呼んで作られます。文字列の書き出しで、制御文字を正しい書き方にするための部品です。

## まとめ

- 16 進数の 1 桁は、0 から 9 と a から f の文字に、番号の差で変換できる。
- 下位 4 ビットだけを使うと、どんな値でも 1 桁に収まる。
- 小さな変換の関数を部品にすると、大きな処理を組み立てやすい。
