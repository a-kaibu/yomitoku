---
title: "4 文字ぶんの 6 ビットを 32 ビットに組み立てる assemble32"
description: "base64 の assemble32 は、4 つの Base64 の値を 6 ビットずつ並べて、32 ビットの整数の上位 24 ビットにします。どれかが無効な値なら、失敗を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/encoding/base64/base64.go"
lines: [623, 634]
function: "assemble32"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, パース, 標準ライブラリ]
---

## ひとことで

Base64 の 4 文字は、それぞれ 6 ビットの値です。`assemble32` は、その 4 つを連結して、3 バイトぶんの値の塊を作ります。無効な文字が混ざっていれば、失敗を返します。

## コード

::: code-group

```go:line-numbers=623 [日本語訳]
func assemble32(n1, n2, n3, n4 byte) (dn uint32, ok bool) {
	// 数字がすべて有効かを確かめる。どれかが 0xff だったなら、
	// それらのビット単位の OR も 0xff になる。
	if n1|n2|n3|n4 == 0xff {
		return 0, false
	}
	return uint32(n1)<<26 |
			uint32(n2)<<20 |
			uint32(n3)<<14 |
			uint32(n4)<<8,
		true
}
```

```go:line-numbers=623 [原文]
func assemble32(n1, n2, n3, n4 byte) (dn uint32, ok bool) {
	// Check that all the digits are valid. If any of them was 0xff, their
	// bitwise OR will be 0xff.
	if n1|n2|n3|n4 == 0xff {
		return 0, false
	}
	return uint32(n1)<<26 |
			uint32(n2)<<20 |
			uint32(n3)<<14 |
			uint32(n4)<<8,
		true
}
```

:::

## 前提知識

- **Base64 の 6 ビット**: 各文字は 0 から 63 までの値を表します。4 文字で 24 ビットになり、3 バイトに対応します。
- **ビットずらし `<<`**: 値を左へずらして、所定の位置に置きます。
- **`|`（OR）**: ビットを重ねて合成します。ずらした値を組み合わせるのに使います。
- **無効な値の印 `0xff`**: 変換表で、対応しない文字は `0xff` に変換されます。OR を取ると、どれかが無効だったことが `0xff` として残ります。

## 何をしているか

### 1. 無効な文字が無いか確かめる

```go:line-numbers=624
	// 数字がすべて有効かを確かめる。どれかが 0xff だったなら、
	// それらのビット単位の OR も 0xff になる。
	if n1|n2|n3|n4 == 0xff {
		return 0, false
	}
```

4 つの値の OR を取ります。どれか 1 つでも `0xff` なら、OR の結果も `0xff` になります。その場合は `0, false` を返して、失敗を伝えます。

### 2. 4 つの値を所定の位置へずらす

```go:line-numbers=629
	return uint32(n1)<<26 |
			uint32(n2)<<20 |
			uint32(n3)<<14 |
			uint32(n4)<<8,
```

最初の値は 26 ビット、次は 20 ビット、その次は 14 ビット、最後は 8 ビットだけ左へずらします。すると、4 つの 6 ビットが、32 ビットの上位 24 ビットに隙間なく並びます。

### 3. 組み立てた値を返す

```go:line-numbers=633
		true
```

並べた値と、`true` を返します。下位 8 ビットは 0 のままです。呼び出し側は、この 24 ビットを 3 バイトに分けて使います。

## ここがすごい

- **OR で一度に確かめる**: 4 つを個別に調べず、1 回の OR で無効な値を見つけます。
- **ずらす量を計算で決める**: 6 ビットずつの位置を、ずらす量の差で揃えているので、並びの規則が読み取りやすくなっています。
- **無効な値を後で伝える**: 値の中に「無効」の印を残さず、戻り値の `false` で伝えるので、呼び出し側は判定に迷いません。

## まとめ

- 4 つの値の OR で、無効な文字が無いかを一度に確かめる。
- 6 ビットずつを 26、20、14、8 ビットずらして、上位 24 ビットに並べる。
- 無効なときは `false` を返し、有効なときは組み立てた値を返す。
