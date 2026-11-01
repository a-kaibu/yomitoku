---
title: "自分と等しくない唯一の値。f != f で NaN を見分ける"
description: "math.IsNaN は、引数が NaN（非数）かどうかを f != f という一見おかしな式で判定します。IEEE 754 では NaN だけが自分自身と等しくないからです。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/bits.go"
lines: [34, 40]
function: "IsNaN"
difficulty: 1
format: 2
tags: [数値計算, イディオム, 標準ライブラリ]
---

## ひとことで

`math.IsNaN(f)` は、`f` が **NaN（Not a Number、非数）** なら `true` を返します。NaN は、`0/0` や `Inf - Inf`、負の数の平方根など、答えが数として定まらない計算の結果として現れる特別な値です。

中身は `return f != f` の 1 行だけです。「自分自身と等しくない」という、ふつうの数ではありえない性質で NaN を見分けています。

## コード

::: code-group

```go:line-numbers=34 [日本語訳]
func IsNaN(f float64) (is bool) {
	// IEEE 754 によれば、f != f を満たすのは NaN だけである。
	// 浮動小数点ハードウェアを使わないなら、次のようにもできる:
	//	x := Float64bits(f);
	//	return uint32(x>>shift)&mask == mask && x != uvinf && x != uvneginf
	return f != f
}
```

```go:line-numbers=34 [原文]
func IsNaN(f float64) (is bool) {
	// IEEE 754 says that only NaNs satisfy f != f.
	// To avoid the floating-point hardware, could use:
	//	x := Float64bits(f);
	//	return uint32(x>>shift)&mask == mask && x != uvinf && x != uvneginf
	return f != f
}
```

:::

## 前提知識

- **IEEE 754**: ほぼすべてのコンピュータが使っている浮動小数点数の規格です。Go の `float64` もこれに従います。
- **NaN の比較**: IEEE 754 では、NaN と何かを比べると、`==`・`<`・`>` などはすべて偽になり、`!=` だけが真になります。相手が NaN 自身でも同じです。
- **名前付き戻り値 `(is bool)`**: 戻り値に名前を付けています。ここでは説明用で、`return f != f` で値を直接返しています。
- **`Float64bits`**: `float64` のビット表現を整数として取り出す関数です（コメントの別解で使われています）。

## 何をしているか

### 1. 自分と比べる

```go:line-numbers=39
	return f != f
```

- `f = 1.5` なら、`1.5 != 1.5` は偽 → `false`
- `f = math.Inf(1)`（正の無限大）なら、`Inf != Inf` は偽 → `false`
- `f = math.NaN()` なら、NaN との比較は `!=` だけが真 → `true`

### 2. 別解

```go:line-numbers=36
	// 浮動小数点ハードウェアを使わないなら、次のようにもできる:
	//	x := Float64bits(f);
	//	return uint32(x>>shift)&mask == mask && x != uvinf && x != uvneginf
```

浮動小数点のハードウェアを使いたくない場合は、ビット表現で判定することもできます。NaN は「指数部のビットがすべて 1 で、仮数部が 0 でない」値なので、

1. 指数部がすべて 1 か調べる
2. 無限大（指数部がすべて 1 で仮数部が 0）でないか調べる

という方法です。コメントは、その書き方を残しています。

## ここがすごい

- **規格の性質をそのまま使う**: 「NaN だけが自分と等しくない」という IEEE 754 の定義を使えば、ビット操作をしなくても 1 回の比較で判定できます。CPU の浮動小数点比較命令 1 つで済みます。
- **NaN の種類を気にしなくてよい**: NaN には、仮数部のビットが違うたくさんの種類（数兆通り）があります。`f == math.NaN()` では判定できません（NaN 同士は等しくならない）が、`f != f` ならどの NaN でも真になります。
- **別解をコメントに残している**: ハードウェアの浮動小数点を使わない方法もコメントにあるので、必要な人はそちらを使えます。

### 注意点

NaN は「`==` で比べられない値」なので、NaN を含む配列の並べ替えや、マップのキーとして使うときに思わぬ動きをします。Go の `cmp.Compare` や `slices.Sort` は、こうした NaN を一貫して扱えるように `x != x` の判定を内部で使っています。

## まとめ

- IEEE 754 では、NaN は自分自身とも等しくない。
- `f != f` は、NaN を判定する短くて確実な書き方。
- NaN は `==` で探せないので、比較や並べ替えでは特別な扱いが必要になる。
