---
title: "両端の空白を削る。ASCII の速い道と、Unicode の遅い道を分けた TrimSpace"
description: "strings.TrimSpace は、文字列の前後にある空白を取り除きます。ほとんどの文字列が ASCII なので、ASCII の範囲は 1 バイトずつ速く見て、非 ASCII に当たったときだけ遅い方法へ切り替えます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [1114, 1141]
function: "TrimSpace"
difficulty: 3
format: 2
tags: [文字列処理, 最適化, Unicode, 標準ライブラリ]
---

## ひとことで

`strings.TrimSpace("  go  ")` は `"go"` を返します。文字列の先頭と末尾にある空白を取り除きます。空白には、スペースやタブ、改行、そして Unicode の空白も含まれます。

この関数は、先頭の空白と末尾の空白を、それぞれ 1 バイトずつ見て探します。ASCII の文字だけなら、この速い道で答えが出ます。

## コード

::: code-group

```go:line-numbers=1114 [日本語訳]
func TrimSpace(s string) string {
	// ASCII 用の高速パス: 最初の ASCII の空白でないバイトを探す。
	for lo, c := range []byte(s) {
		if c >= utf8.RuneSelf {
			// ASCII でないバイトに当たったら、
			// 残りの部分は、Unicode に対応したやや遅い方法で処理する。
			return trimSpaceUnicode(s[lo:])
		}
		if asciiSpace[c] != 0 {
			continue
		}
		s = s[lo:]
		// 今度は末尾から、ASCII の空白でないバイトを探す。
		for hi := len(s) - 1; hi >= 0; hi-- {
			c := s[hi]
			if c >= utf8.RuneSelf {
				return trimRightSpaceUnicode(s[:hi+1])
			}
			if asciiSpace[c] == 0 {
				// この時点で s[:hi+1] は、ASCII の空白でないバイトで始まり終わっている。
				// だから処理は終わりである。
				// ASCII でない場合は、すでに上で処理済みである。
				return s[:hi+1]
			}
		}
	}
	return ""
}
```

```go:line-numbers=1114 [原文]
func TrimSpace(s string) string {
	// Fast path for ASCII: look for the first ASCII non-space byte.
	for lo, c := range []byte(s) {
		if c >= utf8.RuneSelf {
			// If we run into a non-ASCII byte, fall back to the
			// slower unicode-aware method on the remaining bytes.
			return trimSpaceUnicode(s[lo:])
		}
		if asciiSpace[c] != 0 {
			continue
		}
		s = s[lo:]
		// Now look for the first ASCII non-space byte from the end.
		for hi := len(s) - 1; hi >= 0; hi-- {
			c := s[hi]
			if c >= utf8.RuneSelf {
				return trimRightSpaceUnicode(s[:hi+1])
			}
			if asciiSpace[c] == 0 {
				// At this point, s[:hi+1] starts and ends with ASCII
				// non-space bytes, so we're done. Non-ASCII cases have
				// already been handled above.
				return s[:hi+1]
			}
		}
	}
	return ""
}
```

:::

## 前提知識

- **ASCII と非 ASCII**: ASCII は 1 バイトで表せる文字で、値は 128 未満です。それ以外（日本語や全角スペースなど）は、複数のバイトで表されます。
- **`asciiSpace` の表**: 空白文字（`\t`、`\n`、スペースなど）の位置に 1 が入っている 256 要素の表です。1 バイトを表で引くと、空白かどうかがすぐに分かります。
- **`s[lo:]` と `s[:hi+1]`**: 文字列の一部を切り出します。コピーは作らず、元の文字列を共有します。
- **`range` で 1 バイトずつ回す**: `[]byte(s)` の `range` は、バイトの位置と値を順に取り出します。

## 何をしているか

`s = "  ab  "` で追います。

### 1. 先頭の空白を飛ばす

```go:line-numbers=1116
	for lo, c := range []byte(s) {
		if c >= utf8.RuneSelf {
			// If we run into a non-ASCII byte, fall back to the
			// slower unicode-aware method on the remaining bytes.
			return trimSpaceUnicode(s[lo:])
		}
		if asciiSpace[c] != 0 {
			continue
		}
```

先頭から見ていき、空白なら次へ進みます。空白でないバイトが見つかったら、その位置を `lo` として覚えます。途中で非 ASCII のバイトに当たったら、遅い Unicode 版の関数に任せます。

### 2. 末尾の空白を削る

```go:line-numbers=1127
		for hi := len(s) - 1; hi >= 0; hi-- {
			c := s[hi]
			if c >= utf8.RuneSelf {
				return trimRightSpaceUnicode(s[:hi+1])
			}
			if asciiSpace[c] == 0 {
```

今度は末尾から見ていき、空白でないバイトを探します。見つかったら、`s[:hi+1]` で切り出して返します。

## ここがすごい

- **大半のケースを 1 バイトずつで処理する**: 多くの文字列は ASCII です。その場合は、表を引くだけの小さな処理で答えが出ます。Unicode の判定は、必要になったときだけ使います。
- **非 ASCII に当たったら迷わず切り替える**: 途中で切り替えても、残りを正しく処理するので、結果は変わりません。速さのための近道と、正しさが両立しています。
- **コピーを作らない**: 結果は元の文字列の一部として返されます。新しいメモリは作られません。

## まとめ

- 多くの入力が ASCII なら、その場合だけ速い道を用意すると効果が大きい。
- 速い道は、判定できない入力が来たら、正確な遅い道へ切り替える。
- 部分文字列は、コピーせずに返せる。
