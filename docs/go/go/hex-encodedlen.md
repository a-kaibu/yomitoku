---
title: "16 進数にしたときの長さを求める hex.EncodedLen"
description: "encoding/hex の EncodedLen は、n バイトを 16 進数の文字列にしたときの長さを返します。1 バイトは 2 文字になるので、n を 2 倍します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/encoding/hex/hex.go"
lines: [39, 39]
function: "EncodedLen"
difficulty: 1
format: 2
tags: [文字列処理, 数値計算, 標準ライブラリ]
---

## ひとことで

`hex.EncodedLen(3)` は `6` を返します。3 バイトは、16 進数では 6 文字になります。出力用のバッファを作る前に、大きさを知るために使います。

## コード

```go:line-numbers=39
func EncodedLen(n int) int { return n * 2 }
```

## 前提知識

- **16 進数**: 0 から 9 と a から f で、1 桁が 0 から 15 を表します。
- **1 バイトと 2 桁**: 1 バイトは 8 ビットで、16 進数の 2 桁で表せます。
- **バッファの大きさ**: 出力先を先に確保する場合、変換後の長さが分かると無駄がありません。
- **`hex.Encode`**: 実際にバイトを 16 進数の文字に変換する関数です。

## 何をしているか

### 1. バイト数を 2 倍する

```go:line-numbers=39
func EncodedLen(n int) int { return n * 2 }
```

1 バイトは 16 進数の 2 文字になるので、`n * 2` を返します。計算は掛け算 1 回だけです。

## ここがすごい

- **変換せずに長さが分かる**: 実際に変換しなくても、出力の大きさが決まります。
- **式が単純**: 桁数の決まりがそのまま式になっているので、読んで確かめやすいです。
- **確保と変換を分けられる**: 先に長さを求めて確保し、そのあと `Encode` で書き込めます。
- **誤った長さを防げる**: 1 バイトを 2 文字にする決まりは、16 進数の表記そのものから決まります。その決まりを、この 1 行が表しています。
- **元の値を読まない**: バイトの中身に関係なく長さが決まるので、データを調べる前に大きさだけを求められます。

## まとめ

- 1 バイトは 16 進数の 2 文字になる。
- 変換後の長さは、バイト数の 2 倍である。
- 出力バッファを先に確保するときに使う。
