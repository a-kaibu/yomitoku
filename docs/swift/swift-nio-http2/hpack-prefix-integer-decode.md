---
title: "前置整数を読み戻し、桁あふれは例外にする"
description: "HPACK の前置整数を読み戻す関数。1 バイト目の前置ビットがすべて 1 なら、続きのバイトを 7 ビットずつ位を上げながら足す。値が大きすぎて Int に収まらないときは、例外を投げる。"
language: swift
project: "SwiftNIO HTTP/2"
repo: https://github.com/apple/swift-nio-http2
license: Apache-2.0
copyright: "Copyright (c) 2017-2021 Apple Inc. and the SwiftNIO project authors"
commit: "728149ca4f382e42e9cea8837fee9fe00cdb39fe"
file: Sources/NIOHPACK/IntegerCoding.swift
lines: [79, 136]
function: "decodeInteger(from:prefix:)"
difficulty: 3
tags: [ビット演算, ネットワーク, 防御的プログラミング]
format: 2
---
## ひとことで

前置整数の復号は、符号化の逆です。先頭のバイトの前置ビットを読み、値がそこで終わるのか、続きのバイトがあるのかを判定します。
続きがあるときは、各バイトの下位 7 ビットを、少しずつ位を上げながら足していきます。途中で `Int` に収まらなくなったら、エラーにします。通信の相手がおかしなデータを送っても、不正な値を黙って使わないためです。

## コード

::: code-group

```swift:line-numbers=79 [日本語訳]
func decodeInteger(from bytes: ByteBufferView, prefix: Int) throws -> DecodedInteger {
    precondition((1...8).contains(prefix))
    if bytes.isEmpty {
        throw NIOHPACKErrors.InsufficientInput()
    }

    // 詳しくは RFC 7541 § 5.1 を参照してください。

    var index = bytes.startIndex
    // ここでの演算は Int で行い、prefix は 1〜8 なので、検査なしの演算でも安全です。
    // 結果は必ず UInt8 に収まります。
    let prefixMask = UInt8(truncatingIfNeeded: (1 &<< prefix) &- 1)
    let prefixBits = bytes[index] & prefixMask

    if prefixBits != prefixMask {
        // 前置ビットがすべて 1 でなければ、そのビットだけで値が決まるので、ここで終わります。
        return DecodedInteger(value: Int(prefixBits), bytesRead: 1)
    }

    var accumulator = Int(prefixMask)
    bytes.formIndex(after: &index)

    // 残りのバイトは、最上位ビットが 1 の間、下位 7 ビットを取り込みます。
    var shift: Int = 0
    var byte: UInt8 = 0

    repeat {
        if index == bytes.endIndex {
            throw NIOHPACKErrors.InsufficientInput()
        }

        byte = bytes[index]

        let value = Int(byte & valueMask)

        // shift はオーバーフローしません。shift の値は Int.bitWidth より小さいからです。
        let (multiplicationResult, multiplicationOverflowed) = value.multipliedReportingOverflow(by: (1 &<< shift))
        if multiplicationOverflowed {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        let (additionResult, additionOverflowed) = accumulator.addingReportingOverflow(multiplicationResult)
        if additionOverflowed {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        accumulator = additionResult

        // 検査なしの加算でも、Int.bitWidth の値の範囲では、オーバーフローしません。
        shift &+= 7
        if shift >= Int.bitWidth {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        bytes.formIndex(after: &index)
    } while byte & continuationMask == continuationMask

    return DecodedInteger(value: accumulator, bytesRead: bytes.distance(from: bytes.startIndex, to: index))
```

```swift:line-numbers=79 [原文]
func decodeInteger(from bytes: ByteBufferView, prefix: Int) throws -> DecodedInteger {
    precondition((1...8).contains(prefix))
    if bytes.isEmpty {
        throw NIOHPACKErrors.InsufficientInput()
    }

    // See RFC 7541 § 5.1 for details of the encoding/decoding.

    var index = bytes.startIndex
    // The shifting and arithmetic operate on 'Int' and prefix is 1...8, so these unchecked operations are
    // fine and the result must fit in a UInt8.
    let prefixMask = UInt8(truncatingIfNeeded: (1 &<< prefix) &- 1)
    let prefixBits = bytes[index] & prefixMask

    if prefixBits != prefixMask {
        // The prefix bits aren't all '1', so they represent the whole value, we're done.
        return DecodedInteger(value: Int(prefixBits), bytesRead: 1)
    }

    var accumulator = Int(prefixMask)
    bytes.formIndex(after: &index)

    // for the remaining bytes, as long as the top bit is set, consume the low seven bits.
    var shift: Int = 0
    var byte: UInt8 = 0

    repeat {
        if index == bytes.endIndex {
            throw NIOHPACKErrors.InsufficientInput()
        }

        byte = bytes[index]

        let value = Int(byte & valueMask)

        // The shift cannot overflow: the value of 'shift' is strictly less than 'Int.bitWidth'.
        let (multiplicationResult, multiplicationOverflowed) = value.multipliedReportingOverflow(by: (1 &<< shift))
        if multiplicationOverflowed {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        let (additionResult, additionOverflowed) = accumulator.addingReportingOverflow(multiplicationResult)
        if additionOverflowed {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        accumulator = additionResult

        // Unchecked is fine, there's no chance of it overflowing given the possible values of 'Int.bitWidth'.
        shift &+= 7
        if shift >= Int.bitWidth {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        bytes.formIndex(after: &index)
    } while byte & continuationMask == continuationMask

    return DecodedInteger(value: accumulator, bytesRead: bytes.distance(from: bytes.startIndex, to: index))
```

:::

## 前提知識

- **前置ビット**: 1 バイト目の上位の数ビットです。その値がすべて 1 のときだけ、続きのバイトがあります。
- **`multipliedReportingOverflow` と `addingReportingOverflow`**: 掛け算と足し算を行い、溢れたかどうかも一緒に返す関数です。
- **`precondition`**: 条件が満たされないとプログラムを止める検査です。ここでは前置ビットの範囲を確かめます。

## 何をしているか

### 1. 先頭のバイトから、前置ビットを読む

前置ビットを取り出します。それがすべて 1 でなければ、その値がそのまま答えです。

```swift:line-numbers=90
    let prefixMask = UInt8(truncatingIfNeeded: (1 &<< prefix) &- 1)
    let prefixBits = bytes[index] & prefixMask

    if prefixBits != prefixMask {
        // 前置ビットがすべて 1 でなければ、そのビットだけで値が決まるので、ここで終わります。
        return DecodedInteger(value: Int(prefixBits), bytesRead: 1)
    }
```
### 2. 前置ビットがすべて 1 なら、続きを読む

すべて 1 のときは、続きのバイトがあります。累積する値の初めを、前置ビットの最大値にしておきます。

```swift:line-numbers=98
    var accumulator = Int(prefixMask)
    bytes.formIndex(after: &index)

    // 残りのバイトは、最上位ビットが 1 の間、下位 7 ビットを取り込みます。
    var shift: Int = 0
    var byte: UInt8 = 0
```
### 3. 続きのバイトを、7 ビットずつ取り込む

続きのバイトの下位 7 ビットを取り出します。位の大きさは `shift` で、最初は 0、そのあと 7 ずつ増えます。

```swift:line-numbers=105
    repeat {
        if index == bytes.endIndex {
            throw NIOHPACKErrors.InsufficientInput()
        }

        byte = bytes[index]

        let value = Int(byte & valueMask)
```
### 4. 溢れていないか確かめる

掛け算と足し算が溢れたら、`UnrepresentableInteger` を投げます。また、`shift` が `Int.bitWidth` 以上になったときも、同じエラーにします。

```swift:line-numbers=114
        // shift はオーバーフローしません。shift の値は Int.bitWidth より小さいからです。
        let (multiplicationResult, multiplicationOverflowed) = value.multipliedReportingOverflow(by: (1 &<< shift))
        if multiplicationOverflowed {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        let (additionResult, additionOverflowed) = accumulator.addingReportingOverflow(multiplicationResult)
        if additionOverflowed {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

```
### 5. 最上位ビットが 0 になるまで続ける

続きのバイトの最上位ビットが 1 なら、次のバイトを読みます。0 になったら終わりです。読んだバイト数も一緒に返します。

```swift:line-numbers=127
        // 検査なしの加算でも、Int.bitWidth の値の範囲では、オーバーフローしません。
        shift &+= 7
        if shift >= Int.bitWidth {
            throw NIOHPACKErrors.UnrepresentableInteger()
        }

        bytes.formIndex(after: &index)
    } while byte & continuationMask == continuationMask

    return DecodedInteger(value: accumulator, bytesRead: bytes.distance(from: bytes.startIndex, to: index))
```
例として、`0x1F 0x9A 0x0A` を `prefix = 5` で読みます。`0x1F` の前置ビットは 31 で、すべて 1 です。続く `0x9A` は、下位 7 ビットが 26 で、位は 0 なので、`31 + 26 = 57` になります。`0x0A` は 10 で、位は 7 なので、`10 × 128 = 1280` を足して、`1337` になります。3 バイトを読みました。

## ここがすごい

- **溢れを必ず検査する**: 相手から来るデータは信用できません。`multipliedReportingOverflow` で、大きすぎる値を確実に拒否します。
- **`shift` で上限を決める**: 7 ビットずつ位を上げるので、`shift` が `Int.bitWidth` を超えたら、それ以上は読まずに止められます。際限なく続くデータに備えられます。
- **読んだバイト数を返す**: 呼び出し側は、何バイト消費したかが分かるので、次の読み取りの位置を正しく進められます。

## まとめ

- 前置整数は、前置ビットがすべて 1 のときだけ、続きのバイトを 7 ビットずつ読む。
- 掛け算と足し算は、溢れを検査してから計算する。
- 読んだバイト数を返すことで、呼び出し側は次の位置へ正しく進める。
