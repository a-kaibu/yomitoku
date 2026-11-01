---
title: "16 進数の文字を、1 バイトを 2 つに分けて表の添字で引く"
description: "バイト列を 16 進数の文字列に変える関数。1 バイトを 16 で割った商と余りを、文字の表から引いて、2 文字ずつ追加する。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Bytes+Hex.swift
lines: [10, 19]
function: "Sequence.hexEncodedBytes(uppercase:)"
difficulty: 1
tags: [ビット演算, 文字列処理, イディオム]
format: 2
---
## ひとことで

`hexEncodedBytes(uppercase:)` は、バイト列を 16 進数の文字（`0` から `f` まで）のバイト列に変換します。たとえば `0xAB` は、`A` と `B` の 2 文字になります。
1 バイトは 2 つの 16 進数の桁に分けられます。上の桁は 16 で割った商、下の桁は余りです。

## コード

::: code-group

```swift:line-numbers=10 [日本語訳]
    public func hexEncodedBytes(uppercase: Bool = false) -> [UInt8] {
        let table: [UInt8] = uppercase ? radix16TableUppercase : radix16TableLowercase
        var result: [UInt8] = []

        result.reserveCapacity(self.underestimatedCount * 2)  // 結果の容量を見積もっておく（目安）。
        return self.reduce(into: result) { output, byte in
            output.append(table[numericCast(byte / 16)])
            output.append(table[numericCast(byte % 16)])
        }
    }
```

```swift:line-numbers=10 [原文]
    public func hexEncodedBytes(uppercase: Bool = false) -> [UInt8] {
        let table: [UInt8] = uppercase ? radix16TableUppercase : radix16TableLowercase
        var result: [UInt8] = []

        result.reserveCapacity(self.underestimatedCount * 2)  // best guess
        return self.reduce(into: result) { output, byte in
            output.append(table[numericCast(byte / 16)])
            output.append(table[numericCast(byte % 16)])
        }
    }
```

:::

## 前提知識

- **16 進数**: 0〜9 と A〜F の 16 種類の数字で表す記数法です。1 桁で 4 ビットを表せます。
- **`reduce(into:)`**: 結果を書き込み先に積み上げながら、要素を 1 つずつ処理します。
- **`numericCast`**: 整数の型を別の整数の型に変換します。
- **`radix16TableLowercase`**: 0 から f までの文字の ASCII 値を並べた表です。

## 何をしているか

### 1. 文字の表を選ぶ

大文字か小文字かで、使う表を切り替えます。

```swift:line-numbers=11
        let table: [UInt8] = uppercase ? radix16TableUppercase : radix16TableLowercase
```
### 2. 結果の容量を見積もる

1 バイトが 2 文字になるので、結果は元の数の 2 倍の容量を取っておきます。

```swift:line-numbers=14
        result.reserveCapacity(self.underestimatedCount * 2)  // 結果の容量を見積もっておく（目安）。
```
### 3. 上の桁と下の桁を順に追加する

各バイトを 16 で割り、商と余りを表から引いて、2 つ続けて追加します。`0xAB` なら、商 `10`（`A`）と余り `11`（`B`）で、`AB` になります。

```swift:line-numbers=15
        return self.reduce(into: result) { output, byte in
            output.append(table[numericCast(byte / 16)])
            output.append(table[numericCast(byte % 16)])
        }
```
## ここがすごい

- **割り算で桁を分ける**: 16 進数の 1 桁は 4 ビットなので、16 で割った商と余りがそのまま上の桁と下の桁になります。
- **表の添字で文字を引く**: 0〜15 の値を、そのまま添字にして文字を取り出します。条件分岐で文字を作る方法より、単純で速くなります。
- **大文字と小文字は表を変えるだけ**: 処理の流れは同じで、使う表だけを切り替えています。

## まとめ

- 1 バイトの 16 進数表記は、16 で割った商と余りの 2 桁に分けられる。
- 文字の対応は、添字で引ける表にすると分かりやすく速い。
- 結果の大きさを先に見積もると、追加のたびに領域を確保し直さずに済む。
