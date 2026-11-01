---
title: "1mb のような単位付きの文字列を、ビットシフトでバイト数に変える"
description: "kb や mb などの単位付き文字列を、単位に応じた桁数だけ左へずらしてバイト数にする Vapor の ByteCount の初期化。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/ByteCount.swift
lines: [40, 71]
function: "init(stringLiteral:)"
difficulty: 2
tags: [文字列処理, ビット演算]
format: 2
---
## ひとことで

`"1mb"` や `"2kb"` のような文字列を、バイト数に変換します。1KB は 2 の 10 乗、1MB は 2 の 20 乗のバイトなので、単位に対応する桁数だけ数値を左へずらして求めます。

## コード

::: code-group

```swift:line-numbers=40 [日本語訳]
    public init(stringLiteral value: String) {
        // 数字だけなら、そのまま値として使います。
        if let intValue = Int(value) {
            self.value = intValue
            return
        }

        let validSuffixes = [
            "kb": 10,
            "mb": 20,
            "gb": 30,
            "tb": 40,
        ]

        let cleanValue = value.lowercased().trimming(while: { $0 == " " || $0 == "\t" }).replacing(" ", with: "")
        for suffix in validSuffixes {
            guard cleanValue.hasSuffix(suffix.key) else { continue }
            guard let stringIntValue = cleanValue.split(separator: suffix.key).first else {
                fatalError("Invalid string format")
            }

            guard let intValue = Int(stringIntValue) else {
                fatalError("Invalid int value: \(stringIntValue)")
            }

            self.value = intValue << suffix.value
            return
        }

        // 上のループで単位はすべて扱っているので、ここに来るのは想定外の場合です。
        fatalError("Could not parse byte count string: \(value)")
    }
```

```swift:line-numbers=40 [原文]
    public init(stringLiteral value: String) {
        // Short path if it's an int wrapped in a string
        if let intValue = Int(value) {
            self.value = intValue
            return
        }

        let validSuffixes = [
            "kb": 10,
            "mb": 20,
            "gb": 30,
            "tb": 40,
        ]

        let cleanValue = value.lowercased().trimming(while: { $0 == " " || $0 == "\t" }).replacing(" ", with: "")
        for suffix in validSuffixes {
            guard cleanValue.hasSuffix(suffix.key) else { continue }
            guard let stringIntValue = cleanValue.split(separator: suffix.key).first else {
                fatalError("Invalid string format")
            }

            guard let intValue = Int(stringIntValue) else {
                fatalError("Invalid int value: \(stringIntValue)")
            }

            self.value = intValue << suffix.value
            return
        }

        // Assert failure here because all cases are handled in the above loop
        fatalError("Could not parse byte count string: \(value)")
    }
```

:::

## 前提知識

- **文字列リテラルでの初期化**: `ExpressibleByStringLiteral` に準拠すると、`let bytes: ByteCount = "1mb"` のように書けます。ここで `init(stringLiteral:)` が呼ばれます。
- **2 の冪**: 1 を 2 回、10 回、20 回と掛けた数です。2 進数では、1 のあとに 0 が続く形になります。
- **`<<`**: 数値を左へずらす演算です。1 ビットずらすと 2 倍、`n` ビットずらすと `2 の n 乗` 倍になります。
- **`hasSuffix`**: 文字列の末尾が指定した文字列かを調べるメソッドです。

## 何をしているか

### 1. 数字だけなら、そのまま使う

`Int(value)` が成功すれば、単位のない数値なので、そのまま値にして終わります。

```swift:line-numbers=41
        // 数字だけなら、そのまま値として使います。
        if let intValue = Int(value) {
            self.value = intValue
            return
        }
```
### 2. 単位と、その桁数を表にする

単位を小文字にし、空白を取り除いてから、単位と桁数の対応を見ます。`kb` は 10、`mb` は 20 です。

```swift:line-numbers=47
        let validSuffixes = [
            "kb": 10,
            "mb": 20,
            "gb": 30,
            "tb": 40,
        ]

        let cleanValue = value.lowercased().trimming(while: { $0 == " " || $0 == "\t" }).replacing(" ", with: "")
        for suffix in validSuffixes {
            guard cleanValue.hasSuffix(suffix.key) else { continue }
```
### 3. 数の部分を取り出して、桁数だけずらす

単位の前の数字を `Int` にして、`<<` で単位の桁数だけ左へずらします。`1mb` なら `1 << 20`、つまり 1048576 になります。

```swift:line-numbers=57
            guard let stringIntValue = cleanValue.split(separator: suffix.key).first else {
                fatalError("Invalid string format")
            }

            guard let intValue = Int(stringIntValue) else {
                fatalError("Invalid int value: \(stringIntValue)")
            }

            self.value = intValue << suffix.value
            return
```
### 4. どの単位にも合わなければ、止める

単位がどれも合わなかったときは、ここで止めます。

```swift:line-numbers=69
        // 上のループで単位はすべて扱っているので、ここに来るのは想定外の場合です。
        fatalError("Could not parse byte count string: \(value)")
```
## ここがすごい

- **掛け算を書かずに済む**: 「1024 を掛ける」を、「10 ビット左へずらす」として書いています。単位が増えても、表に桁数を足すだけです。
- **数字だけの場合を先に処理する**: `"1000"` のような入力は、単位の検査を飛ばして素早く終わります。
- **単位を表で持つ**: 対応を辞書にまとめているので、単位の追加が 1 行で済みます。

## まとめ

- 数字だけなら、そのままバイト数にする。
- 単位（kb、mb など）の桁数だけ、数値を左へずらす。
- 単位がなければ、想定外として止める。
