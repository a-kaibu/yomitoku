---
title: "数値変換の失敗を、関数名入りのエラーに包む strconv.toError"
description: "strconv の数値変換（ParseInt など）が返す内部エラーを、呼び出し元の関数名と入力文字列を含む NumError に変える toError。構文・範囲・基数・ビット数の 4 種類を判別する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2025 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strconv/number.go"
lines: [231, 243]
function: "toError"
difficulty: 2
tags: [防御的プログラミング, API設計, 型システム]
---

## ひとことで

`strconv.ParseInt("abc", 10, 64)` が失敗すると、エラーには関数名（`ParseInt`）、入力の文字列、そして理由が入ります。その内部の仕組みが `toError` です。内部では、単に `ErrSyntax` などの番兵エラーを返しますが、ここでそれを「どの関数の、どの入力が、なぜ駄目か」を表すエラーに包み直します。

## コード

```go:line-numbers=231
func toError(fn, s string, base, bitSize int, err error) error {
	switch err {
	case strconv.ErrSyntax:
		return syntaxError(fn, s)
	case strconv.ErrRange:
		return rangeError(fn, s)
	case strconv.ErrBase:
		return baseError(fn, s, base)
	case strconv.ErrBitSize:
		return bitSizeError(fn, s, bitSize)
	}
	return err
}
```

## 前提知識

- **番兵エラー（sentinel error）**: `ErrSyntax` のように、あらかじめ用意された決まったエラーの値です。比較の `==` で、種類を判別できます。
- **`NumError`**: 数値変換の失敗を表す型で、関数名、入力、種類を持ちます。`Error()` で、読みやすい文字列になります。
- **基数（base）とビット数（bitSize）**: 変換する進数と、整数の大きさです。どちらもエラーの情報に含めます。
- **型による判別の代わり**: ここでは、`switch err` で値を直接比べて、種類を選んでいます。

## 何をしているか

### 1. 構文エラーと範囲エラー

```go:line-numbers=232
	switch err {
	case strconv.ErrSyntax:
		return syntaxError(fn, s)
	case strconv.ErrRange:
		return rangeError(fn, s)
```

`ErrSyntax` は、数字として読めない文字が含まれていたことを表します。`ErrRange` は、値が型の範囲を超えたことを表します。それぞれに対応した `NumError` を作って返します。

### 2. 基数とビット数の誤り

```go:line-numbers=237
	case strconv.ErrBase:
		return baseError(fn, s, base)
	case strconv.ErrBitSize:
		return bitSizeError(fn, s, bitSize)
	}
	return err
```

基数が正しくない（例えば 1 や 37）ときは、基数の情報を含めたエラーを返します。ビット数が正しくないときも、同じ考え方でビット数を含めます。どれにも当てはまらなければ、元のエラーをそのまま返します。

## ここがすごい

- **内部の番兵を、利用者向けの情報に変える**: 内部では短い番兵で済ませ、公開されるときだけ、必要な文脈を付けます。どちらの良さも取れます。
- **元のエラーを失わない**: 知らない種類のエラーは、そのまま返します。想定外の情報を、誤って消してしまうことがありません。
- **4 つの場合を並べる**: `switch` の形で、起こりうる失敗を一覧にできます。どの失敗がどう表示されるかが、1 か所で読めます。

## まとめ

- `toError` は、内部の番兵エラーを、関数名と入力を含む `NumError` に包み直します。
- 構文、範囲、基数、ビット数のそれぞれに、対応した情報を付けます。
- 知らない種類のエラーは、そのまま返します。
- 利用者は、エラーを見れば、どの入力のどこが駄目だったか分かります。
