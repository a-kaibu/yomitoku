---
title: "バイト列を 4 バイトずつ混ぜ、残りは最後にまとめる"
description: "Scala の MurmurHash3.bytesHash。バイト配列を 4 バイトずつリトルエンディアンの整数にして混ぜ、4 バイトに満たない残りを別に混ぜてから、長さを足して仕上げる。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/util/hashing/MurmurHash3.scala"
lines: [222, 251]
format: 2
function: "MurmurHash3.bytesHash"
difficulty: 3
tags: [ハッシュ, ビット演算, 標準ライブラリ]
---

## ひとことで

Scala の標準ライブラリの MurmurHash3 で、バイト配列のハッシュを計算する `bytesHash` です。4 バイトずつ整数にして `mix` で混ぜ、最後に 4 バイトに満たない残りを別に混ぜます。最後に、配列の長さを混ぜて仕上げます。

## コード

::: code-group

```scala:line-numbers=222 [日本語訳]
  final def bytesHash(data: Array[Byte], seed: Int): Int = {
    var len = data.length
    var h = seed

    // 本体（4 バイトずつ処理します）
    var i = 0
    while(len >= 4) {
      var k = data(i + 0) & 0xFF
      k |= (data(i + 1) & 0xFF) << 8
      k |= (data(i + 2) & 0xFF) << 16
      k |= (data(i + 3) & 0xFF) << 24

      h = mix(h, k)

      i += 4
      len -= 4
    }

    // 残り（4 バイトに満たない部分）
    var k = 0
    if(len == 3) k ^= (data(i + 2) & 0xFF) << 16
    if(len >= 2) k ^= (data(i + 1) & 0xFF) << 8
    if(len >= 1) {
      k ^= (data(i + 0) & 0xFF)
      h = mixLast(h, k)
    }

    // 仕上げ
    finalizeHash(h, data.length)
  }
```

```scala:line-numbers=222 [原文]
  final def bytesHash(data: Array[Byte], seed: Int): Int = {
    var len = data.length
    var h = seed

    // Body
    var i = 0
    while(len >= 4) {
      var k = data(i + 0) & 0xFF
      k |= (data(i + 1) & 0xFF) << 8
      k |= (data(i + 2) & 0xFF) << 16
      k |= (data(i + 3) & 0xFF) << 24

      h = mix(h, k)

      i += 4
      len -= 4
    }

    // Tail
    var k = 0
    if(len == 3) k ^= (data(i + 2) & 0xFF) << 16
    if(len >= 2) k ^= (data(i + 1) & 0xFF) << 8
    if(len >= 1) {
      k ^= (data(i + 0) & 0xFF)
      h = mixLast(h, k)
    }

    // Finalization
    finalizeHash(h, data.length)
  }
```

:::

## 前提知識

- バイト配列は、1 バイト（8 ビット）の数字の並びです。ファイルの中身やネットワークのデータによく使われます。
- `& 0xFF` は、`Byte` を符号なしの 0 から 255 の値として扱うためのマスクです。
- `<< 8`、`<< 16`、`<< 24` は、バイトを上位に移す操作です。4 つを OR で合わせると、4 バイトが 1 つの `Int` になります。
- `mix` と `mixLast` は、前に読んだ混ぜ込みの関数です。ブロックの途中は `mix`、最後のブロックは `mixLast` で混ぜます。
- 「リトルエンディアン」は、下位のバイトを先頭に置く順序です。ここでは `data(i)` が最下位のバイトになります。

## 何をしているか

### 1. 4 バイトずつ整数にして混ぜる

`while` のループで、残りが 4 バイト以上ある間、4 バイトを 1 つの `Int` にまとめます。

```scala:line-numbers=229
      var k = data(i + 0) & 0xFF
      k |= (data(i + 1) & 0xFF) << 8
      k |= (data(i + 2) & 0xFF) << 16
      k |= (data(i + 3) & 0xFF) << 24
```

まとめた `k` を `mix` で `h` に混ぜ、位置 `i` と残りの長さ `len` を 4 ずつ進めます。

### 2. 4 バイトに満たない残りを、まとめて混ぜる

残りが 1 から 3 バイトのときは、`k` に XOR で詰めます。`len == 3` のときは 3 バイト目から、`len >= 2` のときは 2 バイト目から、というように、ある分だけ足します。

```scala:line-numbers=245
      k ^= (data(i + 0) & 0xFF)
      h = mixLast(h, k)
```

残りがあるときだけ、`mixLast` で `h` に混ぜます。

### 3. 配列の長さを混ぜて仕上げる

最後に `finalizeHash(h, data.length)` で、全体の長さを混ぜて仕上げます。長さが違うと、同じ内容の先頭でも違う値になります。

## ここがすごい

- 4 バイトずつ処理すると、1 バイトずつ混ぜるより混ぜる回数が 4 分の 1 になります。大きなデータで効果が大きいです。
- 残りを `k` に詰めてから 1 回だけ `mixLast` で混ぜるので、末尾の処理も軽くまとまっています。
- 長さを最後に混ぜる設計は、文字列のハッシュと同じ考えです。末尾が 0 のデータも長さで区別されます。
- コメント `// Body`、`// Tail`、`// Finalization` で、ループ・残り・仕上げの 3 段を明確に分けています。

## まとめ

- バイト列のハッシュは、4 バイトずつ整数にして混ぜるのが効率的です。
- 残りは別に扱い、最後に長さを混ぜると、長さの違いを区別できます。
- 段階ごとにコメントで区切ると、読みやすい構造になります。
