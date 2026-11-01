---
title: "逃がし方を 1 バイトで表す ESCAPE_MARKERS"
description: "ESCAPE_STRINGS と同じ規則を、1 バイトずつの表で表したもの。制御文字には 1 を入れ、短い書き方がある文字にはバックスラッシュの後ろに続ける文字を入れる。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "\"Copyright 2017-2019 JetBrains s.r.o.\""
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: formats/json/commonMain/src/kotlinx/serialization/json/internal/StringOps.kt
lines: [36, 48]
function: "ESCAPE_MARKERS"
difficulty: 3
tags: [入出力, 文字列処理, 最適化]
format: 2
---

## ひとことで

`ESCAPE_STRINGS` は、置き換えの文字列を入れた表です。`ESCAPE_MARKERS` は、同じ規則を **1 バイト（8 ビット）の値だけ** で表した表です。

文字列を書き出すときに、1 文字ごとに「どう逃がすか」を素早く判断するための表で、長い文字列を扱うときのコストを抑えます。

## コード


::: code-group

```kotlin:line-numbers=36 [日本語訳]
// 注: 128 にしておくと、HotSpot（JVM）が配列の範囲チェックをすべて取り除ける
internal val ESCAPE_MARKERS: ByteArray = ByteArray(128).apply {
    for (c in 0..0x1f) {
        this[c] = 1.toByte()
    }
    this['"'.code] = '"'.code.toByte()
    this['\\'.code] = '\\'.code.toByte()
    this['\t'.code] = 't'.code.toByte()
    this['\b'.code] = 'b'.code.toByte()
    this['\n'.code] = 'n'.code.toByte()
    this['\r'.code] = 'r'.code.toByte()
    this[0x0c] = 'f'.code.toByte()
}
```

```kotlin:line-numbers=36 [原文]
// Note: it is 128 so Hotspot successfully eliminates all range checks
internal val ESCAPE_MARKERS: ByteArray = ByteArray(128).apply {
    for (c in 0..0x1f) {
        this[c] = 1.toByte()
    }
    this['"'.code] = '"'.code.toByte()
    this['\\'.code] = '\\'.code.toByte()
    this['\t'.code] = 't'.code.toByte()
    this['\b'.code] = 'b'.code.toByte()
    this['\n'.code] = 'n'.code.toByte()
    this['\r'.code] = 'r'.code.toByte()
    this[0x0c] = 'f'.code.toByte()
}
```

:::

## 前提知識

- **`ByteArray`**: 1 バイトの値を並べた配列です。各要素は -128 から 127 の数です。
- **`'"'.code.toByte()`**: 文字の番号を 1 バイトの値にします。ここでは、バックスラッシュの後ろに続ける文字そのものを入れています。
- **`ByteArray(128)`**: 0 から 127 の番号の文字を、表で扱えるようにした大きさです。
- **HotSpot**: Java の仮想マシンで、よく使われる処理を速く動かす仕組みを持ちます。範囲の確認を省けるような書き方が、速さにつながります。

## 何をしているか

### 1. 制御文字には 1 を入れる

```kotlin:line-numbers=38
    for (c in 0..0x1f) {
        this[c] = 1.toByte()
    }
```

0 から 31 の制御文字は、すべて `1` にします。`1` は「`\u` の 4 桁で書く」という印です。

### 2. 短い書き方の文字には、その文字を入れる

```kotlin:line-numbers=41
    this['"'.code] = '"'.code.toByte()
    this['\\'.code] = '\\'.code.toByte()
```

引用符とバックスラッシュには、その文字自身を入れます。この値を見れば、バックスラッシュの後ろに何を書くかが分かります。

```kotlin:line-numbers=43
    this['\t'.code] = 't'.code.toByte()
```

タブには `t` を入れます。`\t` と書くための文字です。残りの `b`、`n`、`r`、`f` も同じ形です。

## ここがすごい

- **1 バイトで済む**: 表の 1 つの要素が 1 バイトなので、表全体が 128 バイトです。文字列の表と比べて、非常に小さく収まります。
- **範囲を 128 にする**: 文字の番号は 128 より小さい範囲で扱うので、大きさを 128 にしておくと、範囲の確認を省けると書かれています。
- **印と文字で意味を分ける**: 制御文字は `1` という印、短い書き方の文字はその文字自身、と値を使い分けています。読む側は、値だけで次の処理を決められます。
- **ESCAPE_STRINGS と対応**: 同じ規則を、文字列の表と 1 バイトの表の 2 通りで持っています。速さのために、この 2 つをそろえて作っています。

## まとめ

- 逃がし方の判断を 1 バイトの表で持つと、小さく速く扱える。
- 表の大きさを 128 にすると、範囲の確認を省ける。
- 印と文字を分けて入れると、値を見るだけで次の処理が決まる。
