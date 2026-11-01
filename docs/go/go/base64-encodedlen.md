---
title: "変換後の長さを、パディングの有無から求める EncodedLen"
description: "base64.Encoding.EncodedLen は、n バイトを Base64 にしたときの文字数を返します。3 バイトが 4 文字になることを使い、パディングがあるかで計算を分けます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/encoding/base64/base64.go"
lines: [292, 303]
function: "EncodedLen"
difficulty: 2
format: 2
tags: [数値計算, 文字列処理, 標準ライブラリ]
---

## ひとことで

`base64.StdEncoding.EncodedLen(3)` は `4` を返します。3 バイトは Base64 で 4 文字になります。出力の大きさを先に知りたいときに、バッファの確保に使います。

## コード

::: code-group

```go:line-numbers=292 [日本語訳]
func (enc *Encoding) EncodedLen(n int) int {
	if enc.padChar == NoPadding {
		if n > math.MaxInt/4*3+2 {
			panic("encoded length overflows int")
		}
		return n/3*4 + (n%3*8+5)/6 // 6 ビットずつ数えたときの、最小の文字数。
	}
	if n > math.MaxInt/4*3 {
		panic("encoded length overflows int")
	}
	return (n + 2) / 3 * 4 // 3 バイトごとに 4 文字の塊として数えた、最小の数。
}
```

```go:line-numbers=292 [原文]
func (enc *Encoding) EncodedLen(n int) int {
	if enc.padChar == NoPadding {
		if n > math.MaxInt/4*3+2 {
			panic("encoded length overflows int")
		}
		return n/3*4 + (n%3*8+5)/6 // minimum # chars at 6 bits per char
	}
	if n > math.MaxInt/4*3 {
		panic("encoded length overflows int")
	}
	return (n + 2) / 3 * 4 // minimum # 4-char quanta, 3 bytes each
}
```

:::

## 前提知識

- **Base64**: 6 ビットずつ文字に変える仕組みです。3 バイト（24 ビット）が、4 文字（6 ビット × 4）になります。
- **パディング**: 最後の塊が 3 バイトに足りないとき、文字 `=` で埋める決まりです。`NoPadding` を選ぶと埋めません。
- **オーバーフロー**: 大きな `n` を掛けると、`int` の範囲を超えて負の値になることがあります。そこで、先に上限と比べます。
- **整数除算**: `n/3` のように、切り捨てる割り算です。

## 何をしているか

### 1. パディングなしの場合

```go:line-numbers=293
	if enc.padChar == NoPadding {
		if n > math.MaxInt/4*3+2 {
			panic("encoded length overflows int")
		}
		return n/3*4 + (n%3*8+5)/6 // 6 ビットずつ数えたときの、最小の文字数。
```

パディングが無いときは、6 ビットずつの文字数を求めます。`n/3*4` は、3 バイトの塊の数の 4 倍です。残りの `n%3` バイトは、必要なビット数から文字数を計算して足します。

### 2. パディングありの場合

```go:line-numbers=299
	if n > math.MaxInt/4*3 {
		panic("encoded length overflows int")
	}
	return (n + 2) / 3 * 4 // 3 バイトごとに 4 文字の塊として数えた、最小の数。
```

パディングがあるときは、4 文字の塊の数で決まります。`(n + 2) / 3 * 4` は、端数があれば 1 つ分の塊を増やすので、切り上げの計算になっています。

## ここがすごい

- **変換せずに長さが分かる**: 実際に変換しなくても、出力の大きさを計算で得られます。バッファを一度で確保できます。
- **オーバーフローを先に防ぐ**: 巨大な入力では、計算途中で `int` を超えるので、先に上限を確かめて `panic` にします。
- **端数の扱いを分けて考える**: 3 バイトの塊と、残りの端数を別々に計算することで、パディングの有無に合わせた長さが正確に求まります。

## まとめ

- Base64 は 3 バイトを 4 文字にするので、長さは約 4/3 倍になる。
- パディングの有無で、計算の式を分けている。
- 巨大な入力は、オーバーフローを先に防ぐ。
