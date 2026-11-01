---
title: "符号の指定を「絶対値」と「符号反転」で 1 つの比較にまとめる"
description: "math.IsInf は、値が無限大かどうかを調べる関数です。正・負・どちらでもの 3 通りの指定を、値を変形してから「最大の有限値より大きいか」の 1 回の比較にまとめています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/bits.go"
lines: [46, 57]
function: "IsInf"
difficulty: 1
format: 2
tags: [数値計算, 標準ライブラリ, 可読性]
---

## ひとことで

`math.IsInf(f, sign)` は、`f` が無限大かどうかを返します。`sign` が正なら正の無限大だけ、負なら負の無限大だけ、0 ならどちらでも `true` になります。
`math.IsInf(math.Inf(-1), 0)` は `true`、`math.IsInf(math.Inf(-1), 1)` は `false` です。

3 通りの指定を、**値を前もって変形** することで、最後は「`f > MaxFloat64`」という **1 つの比較** で判定しています。

## コード

::: code-group

```go:line-numbers=46 [日本語訳]
func IsInf(f float64, sign int) bool {
	// 最大の浮動小数点数と比べて無限大かどうかを調べる。
	// 浮動小数点ハードウェアを使わないなら、次のようにもできる:
	//	x := Float64bits(f);
	//	return sign >= 0 && x == uvinf || sign <= 0 && x == uvneginf;
	if sign == 0 {
		f = Abs(f)
	} else if sign < 0 {
		f = -f
	}
	return f > MaxFloat64
}
```

```go:line-numbers=46 [原文]
func IsInf(f float64, sign int) bool {
	// Test for infinity by comparing against maximum float.
	// To avoid the floating-point hardware, could use:
	//	x := Float64bits(f);
	//	return sign >= 0 && x == uvinf || sign <= 0 && x == uvneginf;
	if sign == 0 {
		f = Abs(f)
	} else if sign < 0 {
		f = -f
	}
	return f > MaxFloat64
}
```

:::

## 前提知識

- **無限大（Inf）**: IEEE 754 の浮動小数点数には、正の無限大と負の無限大があります。`1.0 / 0.0` や、大きすぎてあふれた計算の結果として現れます。
- **`math.MaxFloat64`**: `float64` で表せる最大の有限の値（約 1.8 × 10^308）です。これより大きい `float64` は正の無限大しかありません。
- **`Abs(f)`**: 絶対値です。負の無限大は正の無限大になります。
- **`f = -f`**: 符号を反転します。負の無限大は正の無限大に、正の無限大は負の無限大になります。
- **`if ... else if ...`**: 条件を順に調べ、最初に当てはまったものだけを実行します。

## 何をしているか

### 1. どちらの無限大でもよい場合

```go:line-numbers=51
	if sign == 0 {
		f = Abs(f)
```

`sign == 0` なら `f = Abs(f)` で符号を消します。負の無限大も正の無限大になるので、「正の無限大か」だけを調べればよくなります。

### 2. 負の無限大だけを探す場合

```go:line-numbers=53
	} else if sign < 0 {
		f = -f
```

`sign < 0` なら `f = -f` で符号を反転します。負の無限大が正の無限大になり、正の無限大は負の無限大になって、次の比較で落ちます。

### 3. 正の無限大か調べる

```go:line-numbers=56
	return f > MaxFloat64
```

`f > MaxFloat64` が真になるのは、`f` が正の無限大のときだけです。

### 具体例

| f | sign | 変形後 | 結果 |
| --- | --- | --- | --- |
| -Inf | 0 | +Inf | true |
| -Inf | -1 | +Inf | true |
| -Inf | 1 | -Inf | false |
| 1e300 | 0 | 1e300 | false |
| NaN | 0 | NaN | false |

NaN は比較が常に偽になるので、何もしなくても `false` になります。

## ここがすごい

- **場合分けを「入力の変形」に変える**: 3 通りの判定を別々に書く代わりに、入力を変形して 1 通りの問題にそろえています。条件の組み合わせが減り、間違いが起きにくくなります。
- **NaN を特別扱いしなくてよい**: NaN との比較は必ず偽になるという IEEE 754 の性質のおかげで、NaN のための `if` が要りません。
- **別解の提示**:コメントでは、浮動小数点のハードウェアを使わずにビット表現と比べる方法も示しています。比較の書き方も、ビットの書き方も、どちらも学べます。

## まとめ

- 複数の条件を扱うとき、入力を変形して 1 つの判定にまとめられることがある。
- `float64` で `MaxFloat64` より大きいのは正の無限大だけ。
- NaN との比較は必ず偽になるので、判定式によっては NaN を自然に除外できる。
