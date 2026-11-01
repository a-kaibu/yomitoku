---
title: "数字を 1 文字ずつ掛けて足す、短い文字列の整数変換"
description: "strconv.Atoi は、文字列を int に変えます。短くて普通の数字だけなら、各文字を「数字 × 10 + 次の数字」と積み上げる速い道を使い、それ以外は遅い道へ回します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/internal/strconv/atoi.go"
lines: [215, 247]
function: "Atoi"
difficulty: 2
format: 2
tags: [パース, 最適化, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`strconv.Atoi("-123")` は、整数 `-123` を返します。文字列から整数への変換は、プログラムの入力を扱うときに欠かせません。

この関数は、よく使われる短い数字の列を、特別な速い道で処理します。一方、符号だけの文字列、大きすぎる数、アンダースコア付きの数などは、正確さを重視した遅い道に任せます。

## コード

::: code-group

```go:line-numbers=215 [日本語訳]
func Atoi(s string) (int, error) {
	const fnAtoi = "Atoi"

	sLen := len(s)
	if intSize == 32 && (0 < sLen && sLen < 10) ||
		intSize == 64 && (0 < sLen && sLen < 19) {
		// int 型に収まる小さな整数のための高速パス。
		s0 := s
		if s[0] == '-' || s[0] == '+' {
			s = s[1:]
			if len(s) < 1 {
				return 0, ErrSyntax
			}
		}

		n := 0
		for _, ch := range []byte(s) {
			ch -= '0'
			if ch > 9 {
				return 0, ErrSyntax
			}
			n = n*10 + int(ch)
		}
		if s0[0] == '-' {
			n = -n
		}
		return n, nil
	}

	// 不正な値、大きすぎる値、アンダースコア付きの整数のための遅いパス。
	i64, err := ParseInt(s, 10, 0)
	return int(i64), err
}
```

```go:line-numbers=215 [原文]
func Atoi(s string) (int, error) {
	const fnAtoi = "Atoi"

	sLen := len(s)
	if intSize == 32 && (0 < sLen && sLen < 10) ||
		intSize == 64 && (0 < sLen && sLen < 19) {
		// Fast path for small integers that fit int type.
		s0 := s
		if s[0] == '-' || s[0] == '+' {
			s = s[1:]
			if len(s) < 1 {
				return 0, ErrSyntax
			}
		}

		n := 0
		for _, ch := range []byte(s) {
			ch -= '0'
			if ch > 9 {
				return 0, ErrSyntax
			}
			n = n*10 + int(ch)
		}
		if s0[0] == '-' {
			n = -n
		}
		return n, nil
	}

	// Slow path for invalid, big, or underscored integers.
	i64, err := ParseInt(s, 10, 0)
	return int(i64), err
}
```

:::

## 前提知識

- **`int` のサイズ**: `int` は環境によって 32 ビットか 64 ビットです。`intSize` はその大きさを表します。
- **文字の数値化**: `'7' - '0'` は 7 になります。数字の文字は、コードの順番が連続しているからです。
- **`ch -= '0'` の後の `ch > 9`**: 数字でない文字は、引いた結果が大きな値（符号なしの折り返し）になります。`if ch > 9` の 1 回の比較で、数字かどうかを判定できます。
- **`ParseInt`**: 大きな値や、特別な形式の文字列を扱う、より一般的な変換関数です。

## 何をしているか

`s = "-123"` で追います。

### 1. 速い道に入るかを決める

```go:line-numbers=219
	if intSize == 32 && (0 < sLen && sLen < 10) ||
		intSize == 64 && (0 < sLen && sLen < 19) {
```

64 ビット環境では、長さが 1 以上 18 以下の文字列だけを速い道で扱います。18 桁の数字は、`int` の範囲に必ず収まります。長い文字列は、溢れる心配があるので遅い道へ回します。

### 2. 符号を外す

```go:line-numbers=223
		if s[0] == '-' || s[0] == '+' {
			s = s[1:]
```

先頭が符号なら、符号を取り除きます。`s` は `"123"` になります。

### 3. 1 桁ずつ積み上げる

```go:line-numbers=231
		for _, ch := range []byte(s) {
			ch -= '0'
			if ch > 9 {
				return 0, ErrSyntax
			}
			n = n*10 + int(ch)
		}
```

`'1'` は 1 になり、`n = 0*10 + 1 = 1`。次に `'2'` で `n = 1*10 + 2 = 12`、最後に `'3'` で `n = 123` になります。

### 4. 符号を戻す

```go:line-numbers=238
		if s0[0] == '-' {
			n = -n
		}
```

最初に保存しておいた `s0` で、符号を確かめて `n` に反映します。`-123` が返ります。

## ここがすごい

- **数字かどうかを 1 回の比較で判定**: `ch -= '0'` で、数字は 0 から 9 になります。それ以外は 9 より大きくなるので、範囲チェックが 1 回で済みます。
- **溢れないことを長さで保証**: 桁数を 18 に制限すると、計算が `int` の範囲を超えません。長さという簡単な条件で、安全性を確かめています。
- **遅い道を正しさのために残す**: 大きな値やアンダースコアを含む入力は、`ParseInt` が正しく判定します。速い道は、確実に答えが出せる入力だけを扱います。

## まとめ

- 変換の多くが短い入力なら、その場合だけ速い道を用意する。
- 数字の判定は、文字の差を引いて、1 回の比較で行える。
- 溢れの心配は、入力の長さに上限を付けて防げる。
