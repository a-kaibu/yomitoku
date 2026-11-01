---
title: "Base64 の 4 文字を 3 バイトに戻し、形式が正しいかも検査する"
description: "Base64 の文字列を 4 文字ずつ読んで 3 バイトに戻す Vapor の decode64。末尾のパディングや不正な文字は、失敗として nil を返す。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Base64.swift
lines: [56, 99]
function: "decode64(_:using:)"
difficulty: 3
tags: [ビット演算, パース, 防御的プログラミング]
format: 2
---
## ひとことで

Base64 は、バイナリを英数字と `+` `/` の 64 文字で表す方式です。4 文字が 3 バイトに対応します。この関数は、4 文字ずつ 3 バイトに戻し、末尾の `=` の付き方や、不正な文字を見つけたら失敗として `nil` を返します。

## コード

::: code-group

```swift:line-numbers=56 [日本語訳]
    internal static func decode64(_ encoded: Span<UInt8>, using mapping: [UInt8]) -> [UInt8]? {
        guard !encoded.isEmpty else { return [] }
        let outlen = self.sizeDec(for: 6, count: encoded.count)

        return try? [UInt8].init(capacity: outlen) { p in  // 失敗を知らせるには、throw するのが唯一の正しい方法です。
            var idx = 0
            var w = 0 as UInt32
            func get(_ offset: Int) -> UInt32 {
                UInt32(truncatingIfNeeded: mapping[Int(truncatingIfNeeded: encoded[idx &+ offset])]) &<< (24 &- (offset &<< 3))
            }
            while encoded.count &- idx >= 4 {
                w = get(0) | get(1) | get(2) | get(3)
                if w & 0b11000000_11000000_11000000_11000000 == 0 {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 2) & 0xc0) | (w & 0x3f)))
                    idx &+= 4
                } else if w & 0b11000000_11000000_11000000_11000000 == 0b00000000_00000000_00000000_10000000, idx &+ 4 == encoded.count {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
                    idx &+= 4
                } else if w & 0b11000000_11000000_11000000_11000000 == 0b00000000_00000000_10000000_10000000, idx &+ 4 == encoded.count {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    idx &+= 4
                } else {
                    throw BreakLoopError()
                }
            }
            switch encoded.count &- idx {
            case 3:
                w = get(0) | get(1) | get(2)
                guard w & 0b11000000_11000000_11000000_11111111 == 0 else { throw BreakLoopError() }
                p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
            case 2:
                w = get(0) | get(1)
                guard w & 0b11000000_11000000_11111111_11111111 == 0 else { throw BreakLoopError() }
                p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
            case 0:
                break
            default: throw BreakLoopError()
            }
        }
    }
```

```swift:line-numbers=56 [原文]
    internal static func decode64(_ encoded: Span<UInt8>, using mapping: [UInt8]) -> [UInt8]? {
        guard !encoded.isEmpty else { return [] }
        let outlen = self.sizeDec(for: 6, count: encoded.count)

        return try? [UInt8].init(capacity: outlen) { p in  // N.B.: throwing is the only correct way to signal failure
            var idx = 0
            var w = 0 as UInt32
            func get(_ offset: Int) -> UInt32 {
                UInt32(truncatingIfNeeded: mapping[Int(truncatingIfNeeded: encoded[idx &+ offset])]) &<< (24 &- (offset &<< 3))
            }
            while encoded.count &- idx >= 4 {
                w = get(0) | get(1) | get(2) | get(3)
                if w & 0b11000000_11000000_11000000_11000000 == 0 {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 2) & 0xc0) | (w & 0x3f)))
                    idx &+= 4
                } else if w & 0b11000000_11000000_11000000_11000000 == 0b00000000_00000000_00000000_10000000, idx &+ 4 == encoded.count {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
                    idx &+= 4
                } else if w & 0b11000000_11000000_11000000_11000000 == 0b00000000_00000000_10000000_10000000, idx &+ 4 == encoded.count {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    idx &+= 4
                } else {
                    throw BreakLoopError()
                }
            }
            switch encoded.count &- idx {
            case 3:
                w = get(0) | get(1) | get(2)
                guard w & 0b11000000_11000000_11000000_11111111 == 0 else { throw BreakLoopError() }
                p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
            case 2:
                w = get(0) | get(1)
                guard w & 0b11000000_11000000_11111111_11111111 == 0 else { throw BreakLoopError() }
                p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
            case 0:
                break
            default: throw BreakLoopError()
            }
        }
    }
```

:::

## 前提知識

- **Base64 の 1 文字**: 0 から 63 の値を 1 文字ずつ表します。1 文字は 6 ビットです。4 文字で 24 ビットになり、これが 3 バイトに対応します。
- **パディング（`=`）**: 3 バイトに足りない末尾を埋める印です。2 バイト分なら `=` が 1 つ、1 バイト分なら `==` が付きます。
- **`mapping`**: 文字を 0 から 63 の数値に変える表です。表にない文字は、不正な値になります。
- **`throw` と `try?`**: 途中で失敗したら `throw` で抜け、`try?` でその結果を `nil` にまとめる仕組みです。
- **`&<<` と `&>>`**: ビットを左右にずらす、溢れても止まらない演算子です。

## 何をしているか

### 1. 空の入力は、空の配列を返す

入力が空なら、変換する必要がありません。空の配列を返して終わります。

```swift:line-numbers=57
        guard !encoded.isEmpty else { return [] }
```
### 2. 4 文字の塊が、普通の形なら 3 バイトに戻す

4 文字の値を 1 つの 24 ビットにまとめ、上から 8 ビットずつ取り出して 3 バイトにします。途中に `=` の印がない塊だけが、この分岐に入ります。

```swift:line-numbers=66
            while encoded.count &- idx >= 4 {
                w = get(0) | get(1) | get(2) | get(3)
                if w & 0b11000000_11000000_11000000_11000000 == 0 {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 2) & 0xc0) | (w & 0x3f)))
                    idx &+= 4
```
### 3. 末尾にパディングがある 4 文字は、2 バイトか 1 バイト

末尾の `=` は、3 バイトに満たない分を表します。`=` の位置を示すビットの形が一致し、かつ最後の塊であれば、足りない分だけを取り出します。

```swift:line-numbers=73
                } else if w & 0b11000000_11000000_11000000_11000000 == 0b00000000_00000000_00000000_10000000, idx &+ 4 == encoded.count {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
                    idx &+= 4
                } else if w & 0b11000000_11000000_11000000_11000000 == 0b00000000_00000000_10000000_10000000, idx &+ 4 == encoded.count {
                    p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                    idx &+= 4
```
### 4. 残りの文字数で、最後の分を処理する

ループで 4 文字の塊を処理したあとに、残りが 2 文字か 3 文字なら、その分だけを取り出します。ビットの形が合わなければ、不正な入力として失敗させます。

```swift:line-numbers=84
            switch encoded.count &- idx {
            case 3:
                w = get(0) | get(1) | get(2)
                guard w & 0b11000000_11000000_11000000_11111111 == 0 else { throw BreakLoopError() }
                p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
                p.append(UInt8(truncatingIfNeeded: ((w &>> 12) & 0xf0) | ((w &>> 10) & 0x0f)))
            case 2:
                w = get(0) | get(1)
                guard w & 0b11000000_11000000_11111111_11111111 == 0 else { throw BreakLoopError() }
                p.append(UInt8(truncatingIfNeeded: (w &>> 22) | ((w &>> 20) & 0x3)))
            case 0:
                break
            default: throw BreakLoopError()
            }
```
## ここがすごい

- **変換と検査を同時に行う**: 値を戻すときに、ビットの形を確かめています。別の検査を後から重ねるより、不正な入力をすぐ見つけられます。
- **失敗を `nil` に集約する**: 途中の `throw` は、`try?` によって 1 つの `nil` にまとまります。呼ぶ側は、成功と失敗の 2 通りだけを扱えます。
- **一度に 4 文字を扱う**: 1 文字ずつ組み立てるより、ビット演算で 4 文字をまとめて処理するので、速く動きます。

## まとめ

- Base64 の 4 文字は、24 ビットとして 3 バイトに戻る。
- 末尾のパディングは、残りの文字数とビットの形で別に処理する。
- 形が合わない入力は `throw` し、結果は `nil` として返す。
