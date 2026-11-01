---
title: "7 ビットずつ詰める可変長の整数"
description: "Protocol Buffers の varint を書き出す writeVarint32。下位 7 ビットずつを書き出し、続きがあるビットを 1 にする。値が小さいほど短いバイト列になる。"
language: kotlin
project: "Wire"
repo: https://github.com/square/wire
license: Apache-2.0
copyright: "\"Copyright (C) 2013 Square, Inc.\""
commit: "8182e8d58173a9e3a3fd9d81a36864a9d2e42754"
file: wire-runtime/src/commonMain/kotlin/com/squareup/wire/ProtoWriter.kt
lines: [94, 102]
function: "ProtoWriter.writeVarint32"
difficulty: 2
tags: [入出力, ビット演算, 最適化]
format: 2
---

## ひとことで

Wire は、Google の Protocol Buffers（データを小さくまとめる形式）を Kotlin で扱うライブラリです。`writeVarint32` は、32 ビットの整数を **varint** という形で書き出します。varint は、**小さい数ほど少ないバイト数で済む** 整数の書き方です。

たとえば `1` は 1 バイト、`300` は 2 バイトで書けます。固定で 4 バイト使うより、ふつうの数ではずっと短くなります。

## コード

```kotlin:line-numbers=94
  fun writeVarint32(value: Int) {
    @Suppress("NAME_SHADOWING")
    var value = value
    while (value and 0x7f.inv() != 0) {
      sink.writeByte((value and 0x7f) or 0x80)
      value = value ushr 7
    }
    sink.writeByte(value)
  }
```

## 前提知識

- **バイト**: 8 ビットの値です。0 から 255 までの数を入れられます。
- **ビット演算**: `and`（両方 1 のビットだけ 1）、`or`（どちらかが 1 なら 1）、`inv()`（全ビットを反転）、`ushr`（符号を気にせず右にずらす）を使います。
- **`0x7f`**: 2 進数で `0111_1111`、つまり下位 7 ビットを表す値です。
- **`0x80`**: 2 進数で `1000_0000`、つまり最上位のビットだけが 1 の値です。
- **`@Throws(IOException::class)`**: Java から呼ばれたときに、この関数が `IOException` を投げることを伝える注釈です。

## 何をしているか

### 1. 残りが 7 ビットに収まらなければ、続きを書く

`value and 0x7f.inv()` が 0 でなければ、7 ビットより上にまだ数が残っています。そのときは下位 7 ビットに `0x80` を足し、続きがあることを示すフラグにして書きます。

```kotlin:line-numbers=97
    while (value and 0x7f.inv() != 0) {
      sink.writeByte((value and 0x7f) or 0x80)
      value = value ushr 7
    }
```

### 2. 最後の 7 ビット以下は、そのまま書く

残りが 7 ビットに収まったら、ループを抜けて、そのまま書きます。最上位のビットは 0 なので、「ここで終わり」を表します。

```kotlin:line-numbers=101
    sink.writeByte(value)
```

`300` の場合を見てみます。2 進数で `1 0010 1100` です。

1. 下位 7 ビット `010 1100`（44）に `0x80` を足して `0xAC` を書く
2. 残り `10`（2）は 7 ビット以内なので、そのまま `0x02` を書く

結果は `AC 02` の 2 バイトです。

## ここがすごい

- **小さい数が短い**: 数が小さければ、ループが 1 回で終わります。ふつうのデータに多い小さな数を、少ないバイトで表せます。
- **続きのフラグを数に混ぜる**: 各バイトの最上位ビットを「続きがあるか」の印にしています。別の長さの情報を持たなくても、読む側がどこまで続くかを判断できます。
- **符号を気にしない**: `ushr`（符号なしの右シフト）を使うので、負の数を渡しても、最後まで 0 で埋まってしまうことがありません。負の数は、32 ビットすべてを使うので 5 バイトになります。
- **1 つのループで書ける**: 小さい値のための特別な場合を分けずに、同じ繰り返しで全部の長さを扱えます。

## まとめ

- 小さい数ほど少ないバイトで書ける可変長の形式は、ほとんどの数が小さいデータに向いている。
- 続きがあるかを、各バイトの最上位ビットで表せる。
- 符号なしの右シフトを使うと、負の値の扱いが安定する。
