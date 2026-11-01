---
title: "%E3%81%82 の形を、1 バイトずつ元に戻す（URL のデコード）"
description: "URL のパーセントエンコーディングを、1 回の走査で元の文字列に戻す関数。不正な形式は nil を返し、指定したバイトは元の %XX のまま残せる。"
language: swift
project: "Hummingbird"
repo: https://github.com/hummingbird-project/hummingbird
license: Apache-2.0
copyright: "Copyright (c) the Hummingbird authors"
commit: "341e11f65d8e24cf87e9aae427c040f0084ada4e"
file: Sources/HummingbirdCore/Utils/String+percentEncode.swift
lines: [146, 186]
function: "String.removingURLPercentEncoding(utf8Buffer:excluding:)"
difficulty: 2
tags: [文字列処理, ネットワーク, ビット演算]
format: 2
---
## ひとことで

URL では、日本語や記号を `%E3%81%82` のように、`%` と 16 進数 2 桁の並びで書きます。この関数は、その並びを 1 回だけ走査して、元のバイト列に戻します。
たとえば `%E3%81%82` は `あ` になります。書き方が壊れているとき（`%` の後の桁が足りないなど）は `nil` を返します。

## コード

::: code-group

```swift:line-numbers=146 [日本語訳]
    package static func removingURLPercentEncoding(utf8Buffer: some Collection<UInt8>, excluding: Set<UInt8> = []) -> String? {
        let result: String? = withUnsafeTemporaryAllocation(of: UInt8.self, capacity: utf8Buffer.count) { buffer -> String? in
            var i = 0
            var byte: UInt8 = 0
            var hexDigitsRequired = 0
            for v in utf8Buffer {
                if v == UInt8(ascii: "%") {
                    guard hexDigitsRequired == 0 else {
                        return nil
                    }
                    hexDigitsRequired = 2
                } else if hexDigitsRequired > 0 {
                    guard let hex = asciiToHex(v) else {
                        return nil
                    }
                    if hexDigitsRequired == 2 {
                        byte = hex << 4
                    } else if hexDigitsRequired == 1 {
                        byte += hex
                        if excluding.contains(byte) {
                            // 除外するバイトは、元の %XX の形のまま残します。
                            i = buffer[i...i + 2].initialize(fromContentsOf: [UInt8(ascii: "%"), hexToAscii(byte >> 4), v])
                        } else {
                            buffer[i] = byte
                            i += 1
                            byte = 0
                        }
                    }
                    hexDigitsRequired -= 1
                } else {
                    buffer[i] = v
                    i += 1
                }
            }
            guard hexDigitsRequired == 0 else {
                return nil
            }
            return String(decoding: buffer[..<i], as: UTF8.self)
        }
        return result
    }
```

```swift:line-numbers=146 [原文]
    package static func removingURLPercentEncoding(utf8Buffer: some Collection<UInt8>, excluding: Set<UInt8> = []) -> String? {
        let result: String? = withUnsafeTemporaryAllocation(of: UInt8.self, capacity: utf8Buffer.count) { buffer -> String? in
            var i = 0
            var byte: UInt8 = 0
            var hexDigitsRequired = 0
            for v in utf8Buffer {
                if v == UInt8(ascii: "%") {
                    guard hexDigitsRequired == 0 else {
                        return nil
                    }
                    hexDigitsRequired = 2
                } else if hexDigitsRequired > 0 {
                    guard let hex = asciiToHex(v) else {
                        return nil
                    }
                    if hexDigitsRequired == 2 {
                        byte = hex << 4
                    } else if hexDigitsRequired == 1 {
                        byte += hex
                        if excluding.contains(byte) {
                            // Keep the original percent-encoding for this byte
                            i = buffer[i...i + 2].initialize(fromContentsOf: [UInt8(ascii: "%"), hexToAscii(byte >> 4), v])
                        } else {
                            buffer[i] = byte
                            i += 1
                            byte = 0
                        }
                    }
                    hexDigitsRequired -= 1
                } else {
                    buffer[i] = v
                    i += 1
                }
            }
            guard hexDigitsRequired == 0 else {
                return nil
            }
            return String(decoding: buffer[..<i], as: UTF8.self)
        }
        return result
    }
```

:::

## 前提知識

- **パーセントエンコーディング**: 1 バイトを `%` と 16 進数 2 桁で書く方式です。`%20` は空白です。日本語は UTF-8 の 3 バイトずつ、`%` 付きで書かれます。
- **UTF-8**: 文字を 1〜4 バイトで表す文字コードです。デコード後のバイト列は、UTF-8 の文字列として読みます。
- **`withUnsafeTemporaryAllocation`**: 一時的に、固定の大きさのバッファを確保する標準ライブラリの関数です。関数を抜けると、自動で解放されます。
- **`asciiToHex`**: ASCII の 16 進数の文字（`0`〜`9`、`a`〜`f`、`A`〜`F`）を、数値に変換する関数です。

## 何をしているか

### 1. `%` を見つけたら、続く 2 桁を待つ

`%` が来たら、続く 2 桁の 16 進数を待つ状態にします。`%` の後にまた `%` が来たら、形が壊れているので `nil` を返します。

```swift:line-numbers=151
            for v in utf8Buffer {
                if v == UInt8(ascii: "%") {
                    guard hexDigitsRequired == 0 else {
                        return nil
                    }
                    hexDigitsRequired = 2
```
### 2. 16 進数 2 桁を、1 バイトに戻す

1 桁目は上位 4 ビット、2 桁目は下位 4 ビットになります。`excluding` に入っているバイトは、デコードせずに `%XX` の形のまま残します。それ以外は、1 バイトとして書き込みます。

```swift:line-numbers=157
                } else if hexDigitsRequired > 0 {
                    guard let hex = asciiToHex(v) else {
                        return nil
                    }
                    if hexDigitsRequired == 2 {
                        byte = hex << 4
                    } else if hexDigitsRequired == 1 {
                        byte += hex
                        if excluding.contains(byte) {
                            // 除外するバイトは、元の %XX の形のまま残します。
                            i = buffer[i...i + 2].initialize(fromContentsOf: [UInt8(ascii: "%"), hexToAscii(byte >> 4), v])
                        } else {
                            buffer[i] = byte
                            i += 1
                            byte = 0
                        }
                    }
                    hexDigitsRequired -= 1
```
### 3. `%` 以外の文字は、そのままコピーする

`%` でも 16 進数の途中でもない文字は、そのままバッファに書きます。

```swift:line-numbers=175
                } else {
                    buffer[i] = v
                    i += 1
                }
```
### 4. 途中で切れていたら `nil`、そうでなければ文字列にする

最後まで読んだときに、まだ 16 進数の桁が足りなければ、形が壊れているので `nil` を返します。そうでなければ、書いたバイト列を UTF-8 として文字列にします。

```swift:line-numbers=180
            guard hexDigitsRequired == 0 else {
                return nil
            }
            return String(decoding: buffer[..<i], as: UTF8.self)
```
## ここがすごい

- **1 回の走査で済む**: 元の文字列を先に分割したり、途中の文字列を何度も作ったりしません。作る文字列は最後の 1 回だけです。
- **壊れた入力を明確に拒否する**: 形式が不正なら、途中の結果を返さずに `nil` を返します。呼び出し側は、入力が正しくなかったことを確実に知れます。
- **区切りの意味を守れる**: `excluding` に `/` や `?` を指定すると、`%2F` を `/` に戻さずに残せます。デコードで、URL の構造が変わってしまうのを防げます。

## まとめ

- パーセントエンコーディングは、`%` と 16 進数 2 桁の並びを、1 バイトずつ元に戻して読む。
- 形式が壊れていれば `nil` を返し、途中の結果は使わない。
- 元の形のまま残したいバイトは、`excluding` で指定できる。
