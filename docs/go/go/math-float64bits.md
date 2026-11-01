---
title: "浮動小数点数のビットをそのまま整数で読む math.Float64bits"
description: "math.Float64bits は、float64 の値を、同じ 64 ビットの並びを持つ uint64 として読み直します。値の変換ではなく、ビットの見方を変えるだけです。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/unsafe.go"
lines: [35, 35]
function: "Float64bits"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 低レイヤ, 標準ライブラリ]
---

## ひとことで

`math.Float64bits(1.0)` は `0x3ff0000000000000` を返します。`1.0` の内部の 64 ビットを、そのまま整数で見たものです。

## コード

```go:line-numbers=35
func Float64bits(f float64) uint64 { return *(*uint64)(unsafe.Pointer(&f)) }
```

## 前提知識

- **`float64` の形**: 符号、指数部、仮数部の 3 つに分かれた 64 ビットです。
- **値の変換との違い**: `uint64(f)` は数値を切り捨てて変換します。`Float64bits` は、ビットの並びをそのまま見ます。
- **`unsafe.Pointer`**: 任意の型のポインタを、別の型のポインタに変える仕組みです。型の安全を一部手放します。
- **ポインタの間接参照 `*`**: ポインタが指す値を読みます。

## 何をしているか

### 1. 変数のアドレスを別の型として見る

```go:line-numbers=35
func Float64bits(f float64) uint64 { return *(*uint64)(unsafe.Pointer(&f)) }
```

`&f` は、`f` のメモリ上の位置です。それを `unsafe.Pointer` を経由して `*uint64` に変えると、同じメモリを整数として読めるようになります。

### 2. 読んだ値を返す

```go:line-numbers=35
func Float64bits(f float64) uint64 { return *(*uint64)(unsafe.Pointer(&f)) }
```

`*` で、その位置の 64 ビットを `uint64` の値として読み出します。数の大きさは変わらず、ビットの並びがそのまま返ります。

## ここがすごい

- **変換の手間がない**: 計算をせずに、ビットをそのまま取り出せるので、とても速く済みます。
- **浮動小数点の内部を操作できる**: 符号や指数を直接読み書きできるので、`Frexp` などの低レイヤの処理が書けます。
- **安全性は呼び出し側の責任**: `unsafe` を使うので、型の規則を自分で守る必要があります。この関数はその規則を満たすように書かれています。

## まとめ

- `float64` のビットを、同じ 64 ビットの `uint64` として読む。
- 数値の変換ではなく、見方を変えるだけである。
- `unsafe` を使うので、型の規則を守る必要がある。
