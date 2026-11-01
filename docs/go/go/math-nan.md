---
title: "数でない値 NaN を作る math.NaN"
description: "math.NaN は、NaN（数でない値）を表す float64 を返します。定数のビットパターンを浮動小数点数として読み、NaN が必要な場所で使えるようにします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/bits.go"
lines: [31, 31]
function: "NaN"
difficulty: 1
format: 2
tags: [数値計算, ビット演算, 標準ライブラリ]
---

## ひとことで

`math.NaN()` は、計算できない結果や、値が未定であることを表す値を返します。NaN と比べると、`==` も `<` も偽になるので、誤った比較を見つけやすくなります。

## コード

```go:line-numbers=31
func NaN() float64 { return Float64frombits(uvnan) }
```

## 前提知識

- **NaN**: Not a Number の略で、「数でない」値です。0 で割った結果や、無効な計算の結果として現れます。
- **NaN の性質**: NaN と何を比べても、`==` は偽です。NaN だけが、自分自身と等しくありません。
- **`uvnan`**: NaN のビットパターンを表す定数です。指数部がすべて 1 で、仮数部が 0 でないものです。
- **`Float64frombits`**: ビットの並びを、そのまま `float64` として読む関数です。

## 何をしているか

### 1. NaN のビットを浮動小数点数として読む

```go:line-numbers=31
func NaN() float64 { return Float64frombits(uvnan) }
```

定数 `uvnan` の並びを `Float64frombits` で読み、NaN の値にします。計算はせず、ビットを直接使います。

## ここがすごい

- **比べると偽になる性質を持つ**: 誤って NaN を比べたときに、等しいと判定されないので、問題を見つけやすくなります。
- **計算を必要としない**: 0 で割るなどの、特別な計算をせずに作れます。
- **ビットを決めて作る**: 結果のビットパターンが定数で決まっているので、いつも同じ NaN が得られます。

## まとめ

- NaN は、定数のビットパターンを `float64` として読んで作る。
- NaN は、どの値とも等しくならない性質を持つ。
- 計算せずに作れるので、いつも同じ値になる。
