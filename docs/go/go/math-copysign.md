---
title: "大きさと符号を組み合わせる math.Copysign"
description: "math.Copysign は、ある数の大きさと、別の数の符号を組み合わせた値を返します。符号ビットだけを入れ替えるので、値の大きさは変わりません。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/copysign.go"
lines: [9, 11]
function: "Copysign"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 標準ライブラリ]
---

## ひとことで

`math.Copysign(3, -1)` は `-3` を返します。`3` の大きさを保ったまま、符号だけを `-1` のものに変えます。

## コード

```go:line-numbers=9
func Copysign(f, sign float64) float64 {
	return Float64frombits(Float64bits(f)&^signMask | Float64bits(sign)&signMask)
}
```

## 前提知識

- **符号ビット**: 浮動小数点数の最上位のビットです。1 なら負、0 なら正を表します。
- **`signMask`**: 符号ビットだけが 1 になっているマスクです。
- **`&^`（ビットクリア）**: 左の値から、右の値で 1 になっているビットを消します。
- **`|`（OR）**: 2 つの値のビットを合わせます。

## 何をしているか

### 1. 元の値の符号を消す

```go:line-numbers=10
	return Float64frombits(Float64bits(f)&^signMask | Float64bits(sign)&signMask)
```

`Float64bits(f)&^signMask` は、`f` のビットから符号ビットだけを 0 にします。残るのは、大きさを表すビットです。

### 2. 符号だけを取り出す

```go:line-numbers=10
	return Float64frombits(Float64bits(f)&^signMask | Float64bits(sign)&signMask)
```

`Float64bits(sign)&signMask` は、`sign` のビットから符号ビットだけを取り出します。大きさのビットは消えます。

### 3. 2 つを合わせて戻す

```go:line-numbers=10
	return Float64frombits(Float64bits(f)&^signMask | Float64bits(sign)&signMask)
```

両方を OR で合わせ、`Float64frombits` で浮動小数点数に戻します。大きさは `f` のもの、符号は `sign` のものになります。

## ここがすごい

- **計算をしない**: 割り算や比較をせずに、ビットの組み替えだけで符号を移せます。
- **0 や無限大の符号も正しく扱える**: `-0` のような値の符号も、ビットとして直接扱えるので、特別な分岐が要りません。
- **浮動小数点の表し方を生かす**: 符号が別のビットに分かれているという形式を利用した、短い実装です。

## まとめ

- 元の値から、符号ビットだけを消す。
- 符号を取る側から、符号ビットだけを取り出す。
- 2 つを OR で合わせると、大きさと符号を組み合わせた値になる。
