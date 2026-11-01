---
title: "連続するスラッシュを、1 つにまとめる"
description: "パスの文字列にある連続した / を、1 つにまとめる関数。直前がスラッシュだったかという 2 つの状態を切り替えながら、1 回の走査で結果を書き出す。"
language: swift
project: "Swift Foundation"
repo: https://github.com/swiftlang/swift-foundation
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2023 Apple Inc. and the Swift project authors"
commit: "aff1e7f822dc1655deeee887f9661a9b8d032703"
file: Sources/FoundationEssentials/String/String+Path.swift
lines: [292, 322]
function: "String._compressingSlashes()"
difficulty: 1
tags: [文字列処理, イテレータ, 状態機械]
format: 2
---
## ひとことで

ファイルのパスや URL では、`a//b///c` のように、`/` が続いて書かれることがあります。意味は `a/b/c` と同じです。
この関数は、連続した `/` を 1 つにまとめた文字列を返します。元の文字列は変えず、新しい文字列を作ります。

## コード

```swift:line-numbers=292
    internal func _compressingSlashes() -> String {
        guard utf8.count > 1 else {
            return self
        }

        enum SlashState {
            case initial
            case slash
        }

        return String(unsafeUninitializedCapacity: utf8.count) { buffer in
            var state = SlashState.initial
            var i = 0
            for v in utf8 {
                switch state {
                case .initial:
                    buffer[i] = v
                    i += 1
                    if v == ._slash {
                        state = .slash
                    }
                case .slash:
                    if v != ._slash {
                        buffer[i] = v
                        i += 1
                        state = .initial
                    }
                }
            }
            return i
        }
```

## 前提知識

- **UTF-8 のバイト**: `utf8` で 1 バイトずつ見ます。`/` は 1 バイトの文字（0x2F）です。
- **状態機械**: 今の状態と、次の入力から、次の状態と出力を決める考え方です。ここでは「直前が `/` だったか」を状態にしています。
- **`String(unsafeUninitializedCapacity:)`**: 先に大きさを決めて、中身を直接書き込んで文字列を作る方法です。書いた長さを返します。

## 何をしているか

### 1. 1 バイト以下なら、そのまま返す

空や 1 文字の文字列は、まとめる必要がありません。そのまま返します。

```swift:line-numbers=293
        guard utf8.count > 1 else {
            return self
        }
```
### 2. 2 つの状態を決める

状態は 2 つだけです。`initial` は、直前が `/` ではないことを表します。`slash` は、直前が `/` だったことを表します。

```swift:line-numbers=297
        enum SlashState {
            case initial
            case slash
        }
```
### 3. 状態に応じて、書くか捨てるかを決める

`initial` のときは、どのバイトも書きます。`/` が来たら、状態を `slash` にします。`slash` のときは、`/` は捨てます。`/` 以外が来たら、書いて状態を `initial` に戻します。

```swift:line-numbers=306
                switch state {
                case .initial:
                    buffer[i] = v
                    i += 1
                    if v == ._slash {
                        state = .slash
                    }
                case .slash:
                    if v != ._slash {
                        buffer[i] = v
                        i += 1
                        state = .initial
                    }
```
### 4. 書いた長さを返す

すべてのバイトを読み終わったら、書いた数（`i`）を返します。文字列は、その長さの分だけ作られます。

```swift:line-numbers=321
            return i
```
例として `a//b///c` を見ます。`a` は書かれ、最初の `/` は書かれて状態が `slash` になります。2 つ目の `/` は捨てられます。`b` が来ると、書いて状態が `initial` に戻ります。結果は `a/b/c` です。

## ここがすごい

- **1 回の走査で済む**: 元の文字列を、区切りごとに分けて、あとで結合する必要がありません。
- **状態は 1 ビット分**: 必要なのは「直前が `/` か」だけです。2 つの状態で、どの並びも正しく扱えます。
- **同じ長さか短くなる**: まとめた結果は元より短くなるか、同じです。最大の長さの領域を確保し、書いた長さだけを使います。

## まとめ

- 連続する `/` のような繰り返しは、直前の状態を覚えて、捨てるかどうかを決めれば 1 回で処理できる。
- 2 つの状態だけで、読んで書くという単純な流れを作れる。
- 書いた長さを返すことで、確保した領域を無駄なく使える。
