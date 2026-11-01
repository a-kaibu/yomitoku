---
title: "整数を、先頭の数ビットと 7 ビットずつの続きに分けて書く"
description: "HTTP/2 の圧縮方式 HPACK で、整数を、1 バイト目の空いたビットと、続くバイトの 7 ビットずつに分けて書く関数。小さい数は 1 バイトで済み、大きい数だけ続きのバイトを使う。"
language: swift
project: "SwiftNIO HTTP/2"
repo: https://github.com/apple/swift-nio-http2
license: Apache-2.0
copyright: "Copyright (c) 2017-2021 Apple Inc. and the SwiftNIO project authors"
commit: "728149ca4f382e42e9cea8837fee9fe00cdb39fe"
file: Sources/NIOHPACK/IntegerCoding.swift
lines: [42, 66]
function: "encodeInteger(_:to:prefix:prefixBits:)"
difficulty: 3
tags: [ビット演算, ネットワーク, 低レイヤ]
format: 2
---
## ひとことで

HTTP/2 のヘッダーは、HPACK という方式で圧縮されます。その中で、数（長さや索引）を書くのに使われるのが、この **前置整数（prefix integer）** です。
1 バイト目の上位の数ビットは、ほかの情報のために空けておき、残りのビットに数を入れます。小さい数はそれだけで 1 バイトに収まります。収まらなければ、1 バイト目を最大値にして、続きのバイトに残りを 7 ビットずつ書きます。

## コード

::: code-group

```swift:line-numbers=42 [日本語訳]
    if value < k {
        // 値がそのまま 1 バイトに収まります。
        initialByte |= UInt8(truncatingIfNeeded: value)
        buffer.writeInteger(initialByte)
        return 1
    }

    // 1 バイトに収まらないときは、残りのビットをすべて 1 にして、
    // 次のバイトへ進みます。
    initialByte |= UInt8(truncatingIfNeeded: k)
    buffer.writeInteger(initialByte)

    // 前置きのビット分を値から引き、残りを 7 ビットずつ
    // 後続のバイトへ書きます。
    // ここでは検査なしの引き算を使えます。`k` は 0 以上で、`value` は `k` 以上だからです。
    // したがって、この引き算は必ず安全です。
    var n = value &- UInt64(k)
    while n >= 128 {
        let nextByte = (1 << 7) | UInt8(truncatingIfNeeded: n & 0x7f)
        buffer.writeInteger(nextByte)
        n >>= 7
    }

    buffer.writeInteger(UInt8(truncatingIfNeeded: n))
    return buffer.writerIndex &- start
```

```swift:line-numbers=42 [原文]
    if value < k {
        // it fits already!
        initialByte |= UInt8(truncatingIfNeeded: value)
        buffer.writeInteger(initialByte)
        return 1
    }

    // if it won't fit in this byte altogether, fill in all the remaining bits and move
    // to the next byte.
    initialByte |= UInt8(truncatingIfNeeded: k)
    buffer.writeInteger(initialByte)

    // deduct the initial [prefix] bits from the value, then encode it seven bits at a time into
    // the remaining bytes.
    // We can safely use unchecked subtraction here: we know that `k` is zero or greater, and that `value` is
    // either the same value or greater. As a result, this can be unchecked: it's always safe.
    var n = value &- UInt64(k)
    while n >= 128 {
        let nextByte = (1 << 7) | UInt8(truncatingIfNeeded: n & 0x7f)
        buffer.writeInteger(nextByte)
        n >>= 7
    }

    buffer.writeInteger(UInt8(truncatingIfNeeded: n))
    return buffer.writerIndex &- start
```

:::

## 前提知識

- **前置（プレフィックス）ビット**: 1 バイト目の上位の数ビットです。ここでは別の情報（種類を表すフラグなど）に使うため、数の書き込みの前に決まっています。
- **継続ビット**: バイトの最上位のビットです。1 なら、続きのバイトがあることを表します。
- **`k`**: 1 バイト目の、数が入るビットに入る最大値（全部 1 の値）です。`prefix` ビットなら `2^prefix - 1` です。
- **`writeInteger`**: `ByteBuffer` にバイトを書き込む関数です。

## 何をしているか

### 1. 1 バイト目の、数に使えるビットを決める

`prefix` ビットに入る最大値 `k` を求めます。`initialByte` には、あらかじめ決まっているビットを入れておきます。

```swift:line-numbers=39
    let k = (1 &<< prefix) &- 1
    var initialByte = prefixBits
```
### 2. 小さい値は、1 バイトで書く

値が `k` より小さければ、その値を 1 バイト目の下位ビットに入れて終わります。

```swift:line-numbers=42
    if value < k {
        // 値がそのまま 1 バイトに収まります。
        initialByte |= UInt8(truncatingIfNeeded: value)
        buffer.writeInteger(initialByte)
        return 1
    }
```
### 3. 大きい値は、先頭を `k` にして、続きを書く

値が `k` 以上なら、1 バイト目を `k`（数に使えるビットが全部 1）にして書きます。残りの値は、後続のバイトに書きます。

```swift:line-numbers=49
    // 1 バイトに収まらないときは、残りのビットをすべて 1 にして、
    // 次のバイトへ進みます。
    initialByte |= UInt8(truncatingIfNeeded: k)
    buffer.writeInteger(initialByte)
```
### 4. 残りを、引いてから 7 ビットずつ書く

`k` を引いた残りを `n` とします。この引き算は、必ず安全に行えます。

```swift:line-numbers=54
    // 前置きのビット分を値から引き、残りを 7 ビットずつ
    // 後続のバイトへ書きます。
    // ここでは検査なしの引き算を使えます。`k` は 0 以上で、`value` は `k` 以上だからです。
    // したがって、この引き算は必ず安全です。
    var n = value &- UInt64(k)
```
### 5. 128 以上の間、7 ビットずつ書く

`n` が 128 以上なら、下位 7 ビットに継続ビットの 1 を付けて書きます。そのあと `n` を 7 ビット右にずらします。最後に、128 未満になった `n` を書きます。

```swift:line-numbers=59
    while n >= 128 {
        let nextByte = (1 << 7) | UInt8(truncatingIfNeeded: n & 0x7f)
        buffer.writeInteger(nextByte)
        n >>= 7
    }

    buffer.writeInteger(UInt8(truncatingIfNeeded: n))
```
例として、RFC 7541 の例である `1337` を、`prefix = 5` で書きます。`k = 31` で、`1337 - 31 = 1306` です。`1306 & 127 = 26` に継続ビットを付けると `0x9A`、残りは `10` なので `0x0A` です。結果は `0x1F 0x9A 0x0A` の 3 バイトです。

## ここがすごい

- **小さい数は 1 バイト**: 多くのヘッダーの値は小さいので、ほとんどが 1 バイトで済みます。
- **同じ式で、前置ビットの数を変えられる**: `prefix` を変えるだけで、`k` が変わります。4 ビットでも 7 ビットでも、同じ処理で書けます。
- **7 ビットずつの続きは、どんな大きさでも扱える**: 継続ビットで続きの有無を示すので、大きい数も、必要なバイト数だけ使います。

## まとめ

- 前置整数は、1 バイト目の空いたビットに数を入れ、収まらなければ続きのバイトに 7 ビットずつ書く。
- 小さい数は 1 バイトで済み、大きい数は続きのバイトを使う。
- 1 バイト目の最大値 `k` を引いてから書くと、続きの数が小さくなる。
