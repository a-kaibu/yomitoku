---
title: "10 進数の変換は、20 桁ぶんの配列を作って右から書く"
description: "strconv の内部関数 FormatUint は、符号なしの整数を文字列にします。10 進数の場合は、スタック上の固定長の配列に右から書き込んでから、必要な長さだけを文字列にします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/internal/strconv/itoa.go"
lines: [12, 24]
function: "FormatUint"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, メモリ管理, 標準ライブラリ]
---

## ひとことで

`strconv.FormatUint(255, 10)` は、文字列 `"255"` を返します。整数を文字列にする、もっともよく使う変換の 1 つです。

この関数は、10 進数のときだけ特別な道を通ります。小さい数は、あらかじめ用意した文字列から切り出し、それ以外は固定長の配列に右から書き込みます。

## コード

```go:line-numbers=12
func FormatUint(i uint64, base int) string {
	if base == 10 {
		if i < nSmalls {
			return small(int(i))
		}
		var a [24]byte
		nd := numDigits(i)
		formatBase10(a[:nd], i)
		return string(a[:nd])
	}
	_, s := formatBits(nil, i, base, false, false)
	return s
}
```

## 前提知識

- **`uint64` の桁数**: 最大値 `18446744073709551615` は 20 桁です。だから、20 バイトあれば十分ですが、ここでは余裕をもって 24 バイトの配列を使います。
- **`[24]byte`**: 長さが決まった配列です。関数の中で作ると、多くの場合はスタック（関数の実行中だけ使う領域）に置かれます。
- **`numDigits`**: 数の桁数を数える内部の関数です。
- **`a[:nd]`**: 配列の先頭から `nd` 桁ぶんのスライスです。

## 何をしているか

### 1. 小さい数はそのまま切り出す

```go:line-numbers=14
		if i < nSmalls {
			return small(int(i))
		}
```

`nSmalls` は 100 です。100 未満の数は、前に出てきた `small` が、あらかじめ用意した文字列から切り出します。新しいメモリは作りません。

### 2. 桁数を求めて右から書く

```go:line-numbers=17
		var a [24]byte
		nd := numDigits(i)
		formatBase10(a[:nd], i)
		return string(a[:nd])
```

`i = 12345` なら、桁数は 5 です。`formatBase10` は、`a[:5]` に右詰めで数字を書きます。最後に `string(a[:nd])` で、必要な 5 バイトだけを文字列にします。

### 3. 10 進数以外は別の関数に任せる

```go:line-numbers=22
	_, s := formatBits(nil, i, base, false, false)
	return s
```

2 進数や 16 進数は、別の関数が扱います。10 進数だけを特別に速くしています。

## ここがすごい

- **作業用の配列をスタックに置く**: 作業用の領域を、関数の中の固定長配列にしています。途中の変換のために、ヒープへの確保をしません。確保されるのは、最後に作る文字列の 1 回だけです。
- **桁数を先に求める**: 配列の長さを決めるより、必要な桁数を先に数えておけば、無駄な領域を使わずに済みます。
- **よく使う道を分ける**: 10 進数は、ログやフォーマットでもっとも多く使われます。その道だけを、表を使う速い変換に任せています。

## まとめ

- 変換の作業用の領域は、固定長の配列にすればヒープ確保を避けられる。
- 桁数を先に数えると、必要な分だけを確保できる。
- よく使う場合だけを特別な道にすると、コードの複雑さを抑えられる。
